/**
 * Environment validation utilities
 */

/**
 * Validates that required Supabase environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateSupabaseConfig(): void {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env.local file.'
        )
    }

    if (!supabaseAnonKey) {
        throw new Error(
            'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please add it to your .env.local file.'
        )
    }
}

/**
 * Validates all required environment variables
 * @throws Error if any required variables are missing
 */
export function validateConfig(): void {
    validateSupabaseConfig()

    // Add other environment validation here if needed
    // e.g. validateStripeConfig(), validateAuthConfig(), etc.
}