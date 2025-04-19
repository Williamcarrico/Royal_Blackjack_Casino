import { useEffect, useState, useRef } from 'react'
import { useSupabase } from './useSupabase'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
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
 * Update data state based on INSERT event
 */
const handleInsert = <T extends DataItem>(currentData: T[], newItem: T): T[] => {
    return [...currentData, newItem]
}

/**
 * Update data state based on UPDATE event
 */
const handleUpdate = <T extends DataItem>(currentData: T[], updatedItem: T): T[] => {
    return currentData.map(item => item.id === updatedItem.id ? updatedItem : item)
}

/**
 * Update data state based on DELETE event
 */
const handleDelete = <T extends DataItem>(currentData: T[], deletedItem: T): T[] => {
    return currentData.filter(item => item.id !== deletedItem.id)
}

/**
 * Process realtime changes and update state
 */
const processRealtimeChange = <T extends DataItem>(
    currentData: T[],
    payload: PostgresChangesPayload<T>
): T[] => {
    switch (payload.eventType) {
        case 'INSERT':
            return handleInsert(currentData, payload.new)
        case 'UPDATE':
            return handleUpdate(currentData, payload.new)
        case 'DELETE':
            return handleDelete(currentData, payload.old)
        default:
            return currentData
    }
}

/**
 * Fetch initial data from Supabase
 */
const fetchInitialData = async <T extends DataItem>(
    client: SupabaseClient<Database>,
    table: SupabaseTable,
    setData: (data: T[]) => void,
    setError: (error: Error | null) => void,
    setIsLoading: (loading: boolean) => void
) => {
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

            // Handle realtime changes
            const handleRealtimeChange = (payload: PostgresChangesPayload<T>) => {
                setData(currentData => processRealtimeChange(currentData, payload))
                if (callback) callback(payload)
            }

            // Set up the subscription
            // NOTE: There's a known issue with TypeScript definitions in Supabase's Realtime API
            // Using 'any' as a workaround until Supabase addresses this issue
            // See: https://github.com/supabase/realtime-js/issues/201
            channel
                .on(
                    'postgres_changes' as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                    { event, schema: 'public', table, filter },
                    handleRealtimeChange
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
            fetchInitialData(client, table, setData, setError, setIsLoading)

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