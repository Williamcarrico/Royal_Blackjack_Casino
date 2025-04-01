import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pggcbxejytshupruhcjq.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnZ2NieGVqeXRzaHVwcnVoY2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMjA2MTgsImV4cCI6MjA1ODU5NjYxOH0.Xqi99G502aTdSQuN8kFg8rlwMGBn4px9Ohq8dmbx93E'
    )
}