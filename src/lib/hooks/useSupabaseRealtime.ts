import { useEffect, useState, useRef } from 'react'
import { useSupabase } from './useSupabase'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export type SupabaseTable = keyof Database['public']['Tables']
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

// Postgres Changes payload type definition
export interface PostgresColumn {
    name: string;
    type: string;
}

export interface PostgresChangesPayload<T> {
    schema: string;
    table: string;
    commit_timestamp: string;
    eventType: RealtimeEvent;
    new: T;
    old: T;
    errors: string[];
}

interface UseRealtimeOptions<T> {
    event?: RealtimeEvent;
    filter?: string;
    callback?: (payload: PostgresChangesPayload<T>) => void;
}

interface DataItem {
    id: string | number;
    [key: string]: unknown;
}

/**
 * Hook for subscribing to Supabase realtime changes
 *
 * @param table The database table to subscribe to
 * @param options Options for the realtime subscription
 * @returns An object containing the subscription state and data
 */
export function useSupabaseRealtime<T extends DataItem>(
    table: SupabaseTable,
    options: UseRealtimeOptions<T> = {}
) {
    const { client } = useSupabase<Database>()
    const [data, setData] = useState<T[]>([])
    const [error, setError] = useState<Error | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const channelRef = useRef<RealtimeChannel | null>(null)

    const {
        event = '*',
        filter,
        callback
    } = options

    useEffect(() => {
        if (!client) {
            setError(new Error('Supabase client not available'))
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(null)

        const channelId = `realtime:${table}:${event}:${filter || 'all'}`

        try {
            // Create the channel
            const channel = client.channel(channelId)

            // Set up the subscription
            // NOTE: There's a known issue with TypeScript definitions in Supabase's Realtime API
            // Using 'any' as a workaround until Supabase addresses this issue
            // See: https://github.com/supabase/realtime-js/issues/201
            channel
                .on(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    'postgres_changes' as any,
                    {
                        event,
                        schema: 'public',
                        table,
                        filter
                    },
                    (payload: PostgresChangesPayload<T>) => {
                        // Update internal state
                        setData(currentData => {
                            // Handle different events
                            if (payload.eventType === 'INSERT') {
                                return [...currentData, payload.new]
                            } else if (payload.eventType === 'UPDATE') {
                                return currentData.map(item =>
                                    // Compare by id
                                    item.id === payload.new.id ? payload.new : item
                                )
                            } else if (payload.eventType === 'DELETE') {
                                return currentData.filter(item =>
                                    item.id !== payload.old.id
                                )
                            }
                            return currentData
                        })

                        // Call user callback if provided
                        if (callback) {
                            callback(payload)
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        setIsLoading(false)
                    } else if (status === 'CHANNEL_ERROR') {
                        setError(new Error('Failed to subscribe to channel'))
                        setIsLoading(false)
                    }
                })

            // Store channel ref for cleanup
            channelRef.current = channel

            // Fetch initial data
            const fetchInitialData = async () => {
                try {
                    const { data: initialData, error: initialError } = await client
                        .from(table)
                        .select('*')

                    if (initialError) {
                        throw initialError
                    }

                    setData(initialData as T[])
                } catch (err) {
                    console.error('Error fetching initial data:', err)
                    setError(err instanceof Error ? err : new Error('Failed to fetch initial data'))
                } finally {
                    setIsLoading(false)
                }
            }

            fetchInitialData()

            // Cleanup function
            return () => {
                channel.unsubscribe()
            }
        } catch (err) {
            console.error('Error setting up realtime subscription:', err)
            setError(err instanceof Error ? err : new Error('Failed to set up realtime subscription'))
            setIsLoading(false)
            return undefined
        }

    }, [client, table, event, filter, callback])

    return {
        data,
        error,
        isLoading,
        channel: channelRef.current
    }
}