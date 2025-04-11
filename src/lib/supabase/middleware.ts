/**
 * Supabase middleware client for authentication handling
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import supabaseConfig from './config'

/**
 * Creates a Supabase client for use in middleware
 */
export const createMiddlewareClient = <T = Database>(
    req: NextRequest,
    res: NextResponse
) => {
    return createServerClient<T>(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        {
            cookies: {
                get(name: string) {
                    const cookies = req.cookies.getAll()
                    const cookie = cookies.find((cookie) => cookie.name === name)
                    return cookie?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    res.cookies.set({
                        name,
                        value,
                        ...options
                    })
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set({
                        name,
                        value: '',
                        ...options
                    })
                },
            },
        }
    )
}