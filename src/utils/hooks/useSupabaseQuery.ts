import { useState, useEffect, useCallback, useRef } from 'react'
import { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'
import { useSupabase } from './useSupabase'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Result of a Supabase query
 */
export interface QueryResult<T> {
    data: T | null
    error: PostgrestError | null
    isLoading: boolean
    isError: boolean
    refetch: () => Promise<void>
}

/**
 * Hook for fetching data from Supabase with automatic refetching
 * @param queryFn Function that returns a Supabase query
 * @param dependencies Dependencies that, when changed, will trigger a refetch
 * @returns Query result with loading and error states
 */
export function useSupabaseQuery<T>(
    queryFn: (supabase: SupabaseClient<Database>) => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
    dependencies: unknown[] = []
): QueryResult<T> {
    const { client } = useSupabase<Database>()
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<PostgrestError | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const isMounted = useRef(true)

    const fetchData = useCallback(async () => {
        if (!client) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await queryFn(client)

            // Only update state if component is still mounted
            if (isMounted.current) {
                setData(response.data as T)
                setError(response.error)
            }
        } catch (err) {
            // Only update state if component is still mounted
            if (isMounted.current) {
                console.error('Error in useSupabaseQuery:', err)
                setError({
                    message: err instanceof Error ? err.message : 'An unknown error occurred',
                    details: '',
                    hint: '',
                    code: 'client_error',
                    name: 'ClientError'
                })
            }
        } finally {
            // Only update state if component is still mounted
            if (isMounted.current) {
                setIsLoading(false)
            }
        }
    }, [client, queryFn])

    useEffect(() => {
        isMounted.current = true

        if (client) {
            fetchData()
        }

        return () => {
            isMounted.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchData, client, ...dependencies])

    return {
        data,
        error,
        isLoading,
        isError: !!error,
        refetch: fetchData
    }
}