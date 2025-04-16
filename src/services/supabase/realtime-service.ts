import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type SubscriptionCallback = (payload: any) => void
type SubscriptionId = string

/**
 * Service for managing Supabase realtime subscriptions
 */
export class RealtimeService {
    private static instance: RealtimeService
    private supabase: SupabaseClient<Database>
    private channels: Map<SubscriptionId, RealtimeChannel> = new Map()

    private constructor() {
        this.supabase = createClient()
    }

    /**
     * Get the singleton instance of the RealtimeService
     */
    public static getInstance(): RealtimeService {
        if (!RealtimeService.instance) {
            RealtimeService.instance = new RealtimeService()
        }
        return RealtimeService.instance
    }

    /**
     * Subscribe to changes on a table
     */
    async subscribeToTable(
        table: keyof Database['public']['Tables'],
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
        callback: SubscriptionCallback,
        filter?: string
    ): Promise<SubscriptionId> {
        const id = `${table}:${event}:${filter || 'all'}`

        if (this.channels.has(id)) {
            console.warn(`Subscription ${id} already exists. Reusing existing subscription.`)
            return id
        }

        const channel = this.supabase
            .channel(id)
            .on(
                'postgres_changes',
                {
                    event,
                    schema: 'public',
                    table: table as string,
                    filter,
                },
                callback
            )
            .subscribe()

        this.channels.set(id, channel)
        return id
    }

    /**
     * Subscribe to changes on a specific row in a table
     */
    async subscribeToRow(
        table: keyof Database['public']['Tables'],
        rowId: string,
        event: 'UPDATE' | 'DELETE' | '*',
        callback: SubscriptionCallback
    ): Promise<SubscriptionId> {
        return this.subscribeToTable(
            table,
            event,
            callback,
            `id=eq.${rowId}`
        )
    }

    /**
     * Unsubscribe from a subscription
     */
    unsubscribe(subscriptionId: SubscriptionId): boolean {
        const channel = this.channels.get(subscriptionId)
        if (!channel) {
            console.warn(`Subscription ${subscriptionId} not found.`)
            return false
        }

        channel.unsubscribe()
        this.channels.delete(subscriptionId)
        return true
    }

    /**
     * Unsubscribe from all subscriptions
     */
    unsubscribeAll(): void {
        this.channels.forEach(channel => {
            channel.unsubscribe()
        })
        this.channels.clear()
    }
}