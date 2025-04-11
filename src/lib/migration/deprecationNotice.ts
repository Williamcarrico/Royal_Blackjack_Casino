/**
 * @deprecated This file is deprecated and will be removed in a future release.
 * Please use the implementations from '@/lib/supabase' instead.
 *
 * Example:
 * ```
 * // Instead of:
 * import { supabase } from 'supabaseClient'
 *
 * // Use:
 * import { createBrowserClient } from '@/lib/supabase'
 * const supabase = createBrowserClient()
 * ```
 */
export const deprecationNotice = (filename: string) => {
    console.warn(`[DEPRECATED] The file ${filename} is deprecated and will be removed in a future release.
Please use the implementations from '@/lib/supabase' instead.`)
}

export default deprecationNotice