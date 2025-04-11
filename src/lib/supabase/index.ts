/**
 * Supabase client exports
 * This file provides a unified interface to access the appropriate Supabase client
 * based on your context (App Router vs Pages Router)
 */

// Browser client for client components in both App Router and Pages Router
export { createClient as createBrowserClient } from './client'

// Server client for the App Router (server components and API routes)
export { createClient as createServerClient } from './server'

// Server client for the Pages Router (getServerSideProps and API routes)
export { createPagesServerClient } from './pages-client'

/**
 * Default export for the most commonly used client
 * This MUST be the client version to ensure compatibility with both
 * App Router client components and Pages Router
 */
export { createClient } from './client'

export { createMiddlewareClient } from './middleware'
export type { SupabaseClient } from '@supabase/supabase-js'
export type { Database } from '@/types/supabase'