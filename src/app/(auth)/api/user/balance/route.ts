import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserService } from '@/services/supabase/user-service'
import { TransactionType } from '@/types/authTypes'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const userId = session.user.id

        // Get request body
        const { amount, type, gameId, description } = await request.json() as {
            amount: number
            type: TransactionType
            gameId?: string
            description?: string
        }

        // Validate amount
        if (typeof amount !== 'number' || isNaN(amount)) {
            return NextResponse.json(
                { error: 'Invalid amount. Must be a number.' },
                { status: 400 }
            )
        }

        // Validate transaction type
        if (!type || !['bet', 'win', 'loss', 'push', 'deposit', 'withdrawal', 'bonus'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid transaction type' },
                { status: 400 }
            )
        }

        // Update the user's balance and record the transaction
        const success = await UserService.updateUserBalance(
            userId,
            amount,
            type,
            gameId,
            description
        )

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to update balance' },
                { status: 500 }
            )
        }

        // Get updated user stats
        const updatedStats = await UserService.getUserStats(userId)

        return NextResponse.json({
            success: true,
            balance: updatedStats.balance
        })
    } catch (error) {
        console.error('Error updating balance:', error)
        return NextResponse.json(
            { error: 'Failed to update balance' },
            { status: 500 }
        )
    }
}

// Allow users to view their current balance
export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const userId = session.user.id

        // Get user stats including balance
        const stats = await UserService.getUserStats(userId)

        return NextResponse.json({
            success: true,
            balance: stats.balance
        })
    } catch (error) {
        console.error('Error fetching balance:', error)
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        )
    }
}