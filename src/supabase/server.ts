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
 * Helper function to enhance CookieOptions with sensible defaults
 * @param options Base cookie options
 * @returns Enhanced cookie options with defaults applied
 */
const enhanceCookieOptions = (options?: CookieOptions): CookieOptions => {
    // Create a new object or start with an empty one if no options provided
    const enhancedOptions = options ? { ...options } : {};

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
 * Converts CookieOptions to a formatted cookie string
 * @param name Cookie name
 * @param value Cookie value
 * @param options Cookie options (path, maxAge, domain, etc.)
 * @returns Properly formatted cookie string
 */
const stringifyCookieOptions = (name: string, value: string, options?: CookieOptions): string => {
    const enhancedOptions = enhanceCookieOptions(options);
    const cookieParts: string[] = [`${name}=${value}`];

    if (enhancedOptions.path) cookieParts.push(`Path=${enhancedOptions.path}`);
    if (enhancedOptions.maxAge) cookieParts.push(`Max-Age=${enhancedOptions.maxAge}`);
    if (enhancedOptions.domain) cookieParts.push(`Domain=${enhancedOptions.domain}`);
    if (enhancedOptions.expires) cookieParts.push(`Expires=${enhancedOptions.expires.toUTCString()}`);
    if (enhancedOptions.httpOnly) cookieParts.push('HttpOnly');
    if (enhancedOptions.secure) cookieParts.push('Secure');
    if (enhancedOptions.sameSite) cookieParts.push(`SameSite=${enhancedOptions.sameSite}`);

    return cookieParts.join('; ');
};

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
                getAll: () => {
                    return Object.entries(req.cookies).map(([name, value]) => ({
                        name,
                        value: value ?? '',
                    }))
                },
                setAll: (cookies) => {
                    const cookieStrings = cookies.map((cookie) =>
                        stringifyCookieOptions(cookie.name, cookie.value, cookie.options)
                    );
                    res.setHeader('Set-Cookie', cookieStrings);
                },
            },
        }
    )
}