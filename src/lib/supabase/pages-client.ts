/**
 * Supabase client for Pages Router
 * This version uses cookies from the Pages router context instead of next/headers
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import supabaseConfig from './config'
import { type CookieOptions } from '@supabase/ssr'

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
 * Converts CookieOptions to a properly formatted string
 * @param options Cookie options
 * @returns Formatted cookie options string
 */
function stringifyOptions(options: CookieOptions): string {
    const enhancedOptions = enhanceCookieOptions(options);
    const optionsArray: string[] = [];

    if (enhancedOptions.domain) optionsArray.push(`Domain=${enhancedOptions.domain}`);
    if (enhancedOptions.path) optionsArray.push(`Path=${enhancedOptions.path}`);
    if (enhancedOptions.maxAge) optionsArray.push(`Max-Age=${enhancedOptions.maxAge}`);
    if (enhancedOptions.expires) optionsArray.push(`Expires=${enhancedOptions.expires.toUTCString()}`);
    if (enhancedOptions.httpOnly) optionsArray.push('HttpOnly');
    if (enhancedOptions.secure) optionsArray.push('Secure');
    if (enhancedOptions.sameSite) optionsArray.push(`SameSite=${enhancedOptions.sameSite}`);

    return optionsArray.join('; ');
}

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
                    return context.req.cookies[name];
                },
                set(name: string, value: string, options: CookieOptions) {
                    context.res.setHeader('Set-Cookie', `${name}=${value}; ${stringifyOptions(options)}`);
                },
                remove(name: string, options: CookieOptions) {
                    const removeOptions = enhanceCookieOptions({
                        ...options,
                        maxAge: 0,
                    });
                    context.res.setHeader('Set-Cookie', `${name}=; ${stringifyOptions(removeOptions)}`);
                },
            },  
        }
    );
};