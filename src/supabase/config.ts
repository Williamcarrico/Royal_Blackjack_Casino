/**
 * Supabase configuration
 */

/**
 * Get the Supabase URL from environment variables
 */
export const getSupabaseUrl = (): string => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.'
        )
    }
    return url
}

/**
 * Get the Supabase anon key from environment variables
 */
export const getSupabaseAnonKey = (): string => {
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!key) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please check your .env.local file.'
        )
    }
    return key
}

/**
 * Environment configuration for Supabase
 */
export const supabaseConfig = {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
}

export default supabaseConfig