import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, createSupabaseClient } from '../../lib/supabase';
import { storage } from '../storage';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    username: string;
    role: 'user' | 'admin' | 'support';
    credits: number;
    stripeCustomerId?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

// Middleware to verify Supabase JWT tokens and get user data from our database
export const requireSupabaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase using the normal client
    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Map role from Supabase app_metadata (defaults to 'user')
    // Special case: andersonnarciso@gmail.com is always admin
    let supabaseRole = user.app_metadata?.role || 'user';
    if (user.email === 'andersonnarciso@gmail.com') {
      supabaseRole = 'admin';
    }
    
    // Ensure user exists with Supabase mapping (safe and idempotent)
    let dbUser;
    try {
      console.log('🔍 Auth Debug - Creating/updating user:', {
        supabaseId: user.id,
        email: user.email,
        role: supabaseRole,
        metadata: user.user_metadata
      });
      
      dbUser = await storage.ensureUserBySupabase(user.id, user.email || '', {
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
        username: user.user_metadata?.username,
        role: supabaseRole
      });
      
      console.log('✅ Auth Debug - User ensured successfully:', {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role
      });
    } catch (ensureError: any) {
      console.error('❌ User ensure failed:', ensureError);
      return res.status(500).json({ message: 'User setup failed', details: ensureError.message });
    }
    
    req.user = {
      id: dbUser.id, // CRITICAL: Use local DB ID, not Supabase ID
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      username: dbUser.username,
      role: supabaseRole, // Use role from Supabase metadata
      credits: dbUser.credits,
      stripeCustomerId: dbUser.stripeCustomerId,
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    };
    next();
  } catch (error: any) {
    // This should only catch unexpected errors, not auth or migration issues
    console.error('Unexpected auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware that requires admin role (checks Supabase app_metadata)
export const requireSupabaseAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token with Supabase using the normal client
    const supabase = createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check admin role directly from Supabase app_metadata
    // Special case: andersonnarciso@gmail.com is always admin
    let userRole = user.app_metadata?.role;
    if (user.email === 'andersonnarciso@gmail.com') {
      userRole = 'admin';
    }
    
    if (!userRole || !['admin', 'support'].includes(userRole)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Set user data on request (same logic as requireSupabaseAuth)
    try {
      const dbUser = await storage.ensureUserBySupabase(user.id, user.email || '', {
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
        username: user.user_metadata?.username,
        role: userRole
      });
      req.user = {
        id: dbUser.id, // CRITICAL: Use local DB ID, not Supabase ID
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        username: dbUser.username,
        role: userRole, // Use role from Supabase metadata
        credits: dbUser.credits,
        stripeCustomerId: dbUser.stripeCustomerId,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      };
      next();
    } catch (ensureError: any) {
      console.error('Admin user ensure failed:', ensureError);
      return res.status(500).json({ message: 'Admin user setup failed', details: ensureError.message });
    }
  } catch (error: any) {
    // This should only catch unexpected errors, not auth or database issues
    console.error('Unexpected admin auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};