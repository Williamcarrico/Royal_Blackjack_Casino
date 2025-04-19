/**
 * Supabase middleware client for authentication handling
 */
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import supabaseConfig from './config'

/**
 * Helper function to enhance CookieOptions with sensible defaults
 * @param options Base cookie options
 * @returns Enhanced cookie options with defaults applied
 */
const enhanceCookieOptions = (options: CookieOptions): CookieOptions => {
    // Create a new object to avoid mutating the original
    const enhancedOptions = { ...options };

    // Set sensible defaults if not provided
    if (enhancedOptions.path === undefined) enhancedOptions.path = '/';

    // In production, cookies should be secure by default
    if (process.env.NODE_ENV === 'production' && enhancedOptions.secure === undefined) {
        enhancedOptions.secure = true;
    }

    // Apply SameSite=Lax as a sensible default if not specified
    if (enhancedOptions.sameSite === undefined) enhancedOptions.sameSite = 'lax';

    return enhancedOptions;
};

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
                    const enhancedOptions = enhanceCookieOptions(options);
                    res.cookies.set({
                        name,
                        value,
                        ...enhancedOptions
                    })
                },
                remove(name: string, options: CookieOptions) {
                    const enhancedOptions = enhanceCookieOptions({
                        ...options,
                        maxAge: 0 // Ensure the cookie is expired
                    });

                    res.cookies.set({
                        name,
                        value: '', // Empty value for deletion
                        ...enhancedOptions
                    })
                },
            },
        }
    )
}