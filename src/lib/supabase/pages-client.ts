/**
 * Supabase client for Pages Router
 * This version uses cookies from the Pages router context instead of next/headers
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import supabaseConfig from './config'
import { type CookieOptions } from '@supabase/ssr'

/**
 * Creates a typed Supabase client for Pages Router
 * Use this in getServerSideProps or API routes in the pages directory
 */
export const createPagesServerClient = <T = Database>() => (
    context: { req: any; res: any }
) => {
    return createSupabaseServerClient<T>(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        {
            cookies: {
                get(name: string) {
                    return context.req.cookies[name]
                },
                set(name: string, value: string, options: CookieOptions) {
                    context.res.setHeader('Set-Cookie', `${name}=${value}; ${stringifyOptions(options)}`)
                },
                remove(name: string, options: CookieOptions) {
                    context.res.setHeader('Set-Cookie', `${name}=; Max-Age=0; ${stringifyOptions(options)}`)
                },
            },
        }
    )
}

// Helper to convert cookie options to string
function stringifyOptions(options: CookieOptions): string {
    const optionsArray: string[] = []

    if (options.domain) optionsArray.push(`Domain=${options.domain}`)
    if (options.path) optionsArray.push(`Path=${options.path}`)
    if (options.maxAge) optionsArray.push(`Max-Age=${options.maxAge}`)
    if (options.expires) optionsArray.push(`Expires=${options.expires.toUTCString()}`)
    if (options.httpOnly) optionsArray.push('HttpOnly')
    if (options.secure) optionsArray.push('Secure')
    if (options.sameSite) optionsArray.push(`SameSite=${options.sameSite}`)

    return optionsArray.join('; ')
}