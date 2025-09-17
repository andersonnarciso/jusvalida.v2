import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../../lib/supabase';
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
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Map role from Supabase app_metadata (defaults to 'user')
    const supabaseRole = user.app_metadata?.role || 'user';
    
    // Get or migrate the user to our database using Supabase ID
    const dbUser = await storage.migrateUserToSupabaseId(user.id, user.email || '', {
      first_name: user.user_metadata?.first_name,
      last_name: user.user_metadata?.last_name,
      username: user.user_metadata?.username,
      role: supabaseRole
    });
    
    req.user = {
      id: user.id, // Use Supabase ID
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
    console.error('Supabase auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
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
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Check admin role directly from Supabase app_metadata
    const userRole = user.app_metadata?.role;
    if (!userRole || !['admin', 'support'].includes(userRole)) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Set user data on request (same logic as requireSupabaseAuth)
    try {
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        throw new Error('User not found in database');
      }
      req.user = {
        id: user.id, // Use Supabase ID
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
    } catch (dbError) {
      // If user doesn't exist in our database, create them with Supabase ID
      const newUser = await storage.createUserWithSupabaseId(user.id, {
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        password: '', // Not needed for Supabase users
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        credits: 20, // Default credits for new users
        role: userRole, // Set role from Supabase metadata
      });
      req.user = {
        id: user.id, // Use Supabase ID
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        role: userRole, // Use role from Supabase metadata
        credits: newUser.credits,
        stripeCustomerId: newUser.stripeCustomerId,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      };
      next();
    }
  } catch (error: any) {
    console.error('Supabase admin auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};