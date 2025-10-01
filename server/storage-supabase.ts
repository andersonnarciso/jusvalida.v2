import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'support';
  credits: number;
  stripeCustomerId?: string | null;
  stripeMode: 'test' | 'live';
  supabaseId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IStorage {
  getAllUsers(page?: number, limit?: number): Promise<{users: User[], total: number}>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  ensureUserBySupabase(supabaseId: string, email: string, supabaseUserData: any): Promise<User>;
}

export class SupabaseStorage implements IStorage {
  async getAllUsers(page: number = 1, limit: number = 20): Promise<{users: User[], total: number}> {
    try {
      const offset = (page - 1) * limit;
      
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Error fetching users:', error);
        return { users: [], total: 0 };
      }
      
      const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error counting users:', countError);
        return { users: users || [], total: users?.length || 0 };
      }
      
      return {
        users: users || [],
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return { users: [], total: 0 };
    }
  }
  
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('Error fetching user by email:', error);
        return undefined;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }
  
  async ensureUserBySupabase(supabaseId: string, email: string, supabaseUserData: any): Promise<User> {
    try {
      // Check if user exists
      const existingUser = await this.getUserByEmail(email);
      
      if (existingUser) {
        // Update supabase_id if missing
        if (!existingUser.supabaseId) {
          const { data, error } = await supabase
            .from('users')
            .update({ supabase_id: supabaseId })
            .eq('id', existingUser.id)
            .select()
            .single();
          
          if (error) {
            console.error('Error updating user supabase_id:', error);
          } else {
            return data;
          }
        }
        return existingUser;
      }
      
      // Create new user
      const newUser = {
        username: email.split('@')[0],
        email: email,
        password: '',
        first_name: supabaseUserData.first_name || 'User',
        last_name: supabaseUserData.last_name || 'Name',
        role: supabaseUserData.role || 'user',
        credits: 5,
        supabase_id: supabaseId,
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating user:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in ensureUserBySupabase:', error);
      throw error;
    }
  }
}

export const storage = new SupabaseStorage();
