/**
 * Supabase client for Server Components and Pages Router API routes
 * This version uses the Pages Router cookie handling approach
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { CookieOptions } from '@supabase/ssr'
import supabaseConfig from './config'

/**
 * Creates a typed Supabase client for Pages Router API routes
 * @returns Typed Supabase client for use in pages directory
 */
export const createClient = async <T = Database>(
    req: NextApiRequest,
    res: NextApiResponse
) => {
    return createSupabaseServerClient<T>(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        {
            cookies: {
                get: (name) => {
                    return req.cookies[name]
                },
                set: (name, value, options: CookieOptions) => {
                    res.setHeader('Set-Cookie', `${name}=${value}; Path=${options.path || '/'}; ${options.maxAge ? `Max-Age=${options.maxAge};` : ''} ${options.domain ? `Domain=${options.domain};` : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''} ${options.secure ? 'Secure;' : ''}`)
                },
                remove: (name, options: CookieOptions) => {
                    res.setHeader('Set-Cookie', `${name}=; Path=${options.path || '/'}; Max-Age=0; ${options.domain ? `Domain=${options.domain};` : ''} ${options.sameSite ? `SameSite=${options.sameSite};` : ''} ${options.secure ? 'Secure;' : ''}`)
                },
            },
        }
    )
}