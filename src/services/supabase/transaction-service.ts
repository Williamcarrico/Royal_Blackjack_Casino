import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Represents a transaction record from the database
 */
export interface Transaction {
    id: string
    user_id: string
    amount: number
    currency: string
    type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'bonus'
    status: 'pending' | 'completed' | 'failed'
    description?: string
    metadata?: Record<string, unknown>
    created_at: string
    updated_at?: string
}

/**
 * Generic result interface for transaction operations
 */
export interface TransactionResult<T = Transaction[]> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Options for querying transactions
 */
export interface TransactionQueryOptions {
    limit?: number
    offset?: number
    orderBy?: 'created_at' | 'amount' | 'type' | 'status'
    order?: 'asc' | 'desc'
    status?: Transaction['status']
    type?: Transaction['type']
    fromDate?: string
    toDate?: string
}

/**
 * Service for handling transaction-related operations
 */
export const TransactionService = {
    /**
     * Fetches transactions for a specific user
     */
    async getUserTransactions(
        userId: string,
        options: TransactionQueryOptions = {}
    ): Promise<TransactionResult> {
        const {
            limit = 50,
            offset = 0,
            orderBy = 'created_at',
            order = 'desc',
            status,
            type,
            fromDate,
            toDate
        } = options

        try {
            const supabase = await createClient()
            return await this.fetchTransactions(supabase, {
                userId,
                limit,
                offset,
                orderBy,
                order,
                status,
                type,
                fromDate,
                toDate
            })
        } catch (error) {
            console.error('Transaction service error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve transactions',
                message: 'An unexpected error occurred while fetching transactions'
            }
        }
    },

    /**
     * Internal method to fetch transactions with filtering options
     */
    async fetchTransactions(
        supabase: SupabaseClient,
        {
            userId,
            limit,
            offset,
            orderBy,
            order,
            status,
            type,
            fromDate,
            toDate
        }: {
            userId: string
            limit: number
            offset: number
            orderBy: string
            order: 'asc' | 'desc'
            status?: Transaction['status']
            type?: Transaction['type']
            fromDate?: string
            toDate?: string
        }
    ): Promise<TransactionResult> {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order(orderBy, { ascending: order === 'asc' })
            .range(offset, offset + limit - 1)

        // Apply optional filters
        if (status) query = query.eq('status', status)
        if (type) query = query.eq('type', type)
        if (fromDate) query = query.gte('created_at', fromDate)
        if (toDate) query = query.lte('created_at', toDate)

        const { data, error } = await query

        if (error) {
            console.error('Error fetching transactions:', error)
            return {
                success: false,
                error: error.message,
                message: 'Failed to retrieve transactions from the database'
            }
        }

        return {
            success: true,
            data: data as Transaction[]
        }
    },

    /**
     * Creates a new transaction
     */
    async createTransaction(
        transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
    ): Promise<TransactionResult<Transaction>> {
        try {
            const supabase = await createClient()

            const { data, error } = await supabase
                .from('transactions')
                .insert(transaction)
                .select('*')
                .single()

            if (error) {
                return {
                    success: false,
                    error: error.message,
                    message: 'Failed to create transaction'
                }
            }

            return {
                success: true,
                data: data as Transaction,
                message: 'Transaction created successfully'
            }
        } catch (error) {
            console.error('Transaction creation error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create transaction',
                message: 'An unexpected error occurred while creating the transaction'
            }
        }
    }
}