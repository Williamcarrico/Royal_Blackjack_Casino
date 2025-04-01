import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

// Use environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pggcbxejytshupruhcjq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2NieGVqeXRzaHVwcnVoY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjA2MTgsImV4cCI6MjA1ODU5NjYxOH0.Xqi99G502aTdSQuN8kFg8rlwMGBn4px9Ohq8dmbx93E';

// Create client with type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);