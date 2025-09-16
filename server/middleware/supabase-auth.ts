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

    // Get the user data from our database
    try {
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        throw new Error('User not found in database');
      }
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        username: dbUser.username,
        role: dbUser.role,
        credits: dbUser.credits,
        stripeCustomerId: dbUser.stripeCustomerId,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      };
      next();
    } catch (dbError) {
      // If user doesn't exist in our database, create them
      const newUser = await storage.createUser({
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        password: '', // Not needed for Supabase users
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        credits: 20, // Default credits for new users
      });
      req.user = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        username: newUser.username,
        role: newUser.role,
        credits: newUser.credits,
        stripeCustomerId: newUser.stripeCustomerId,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      };
      next();
    }
  } catch (error: any) {
    console.error('Supabase auth error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Middleware that requires admin role
export const requireSupabaseAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  await requireSupabaseAuth(req, res, () => {
    if (!req.user || !['admin', 'support'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};