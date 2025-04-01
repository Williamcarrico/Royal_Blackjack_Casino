import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TransactionService } from '@/services/supabase/transaction-service'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const userId = session.user.id

        // Get pagination parameters from URL
        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Get transactions for the user
        const { success, data: transactions, error } = await TransactionService.getUserTransactions(
            userId,
            limit,
            offset
        )

        if (!success) {
            return NextResponse.json({ error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            transactions
        })
    } catch (error) {
        console.error('Error fetching transactions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}