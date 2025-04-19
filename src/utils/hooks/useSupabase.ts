/**
 * Hook for accessing the Supabase client in client components
 */
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Hook for accessing the Supabase client in client components
 * Provides memoized instance of the Supabase client
 *
 * @returns Typed Supabase client instance
 */
export function useSupabase<T = Database>() {
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)
    const clientRef = useRef<SupabaseClient<T> | null>(null)

    useEffect(() => {
        // Create client only on the client side and only once
        if (typeof window !== 'undefined' && !clientRef.current) {
            try {
                const supabaseClient = createBrowserClient<T>()
                clientRef.current = supabaseClient
                setIsLoading(false)
            } catch (err) {
                console.error('Error initializing Supabase client:', err)
                setError(err instanceof Error ? err : new Error('Failed to initialize Supabase client'))
                setIsLoading(false)
            }
        } else {
            setIsLoading(false)
        }
    }, [])

    return {
        client: clientRef.current,
        isLoading,
        error
    }
}