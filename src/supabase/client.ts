/**
 * Supabase client for client-side environments (Client Components and pages directory)
 */
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import supabaseConfig from './config'

/**
 * Creates a typed Supabase client for client-side environments
 * @returns Typed Supabase client for Client Components and pages directory
 */
export const createClient = <T = Database>() => {
    return createBrowserClient<T>(
        supabaseConfig.url,
        supabaseConfig.anonKey
    )
}