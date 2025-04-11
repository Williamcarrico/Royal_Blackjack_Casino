import { NextRequest, NextResponse } from 'next/server'
import { GameService } from '@/services/supabase/game-service'
import { AuthService } from '@/services/supabase/auth-service'
import { UserService } from '@/services/supabase/user-service'
import { Card } from '@/types/cardTypes'
import { HandResult as RoundResult } from '@/types/handTypes'

// Define SideBet type locally
type SideBet = {
	type: string;
	amount: number;
	payout?: number;
};

/**
 * API route for recording a completed hand
 */
export async function POST(request: NextRequest) {
	try {
		const { user, error } = await AuthService.getCurrentUser()

		if (!user || error) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
		}

		const {
			sessionId,
			betAmount,
			playerCards,
			dealerCards,
			actions,
			result,
			payout,
			sideBets: rawSideBets,
		} = (await request.json()) as {
			sessionId: string
			betAmount: number
			playerCards: Card[]
			dealerCards: Card[]
			actions: string[]
			result: RoundResult
			payout: number
			sideBets?: Record<
				string,
				{
					amount: number
					payout?: number
				}
			>
		}

		// Transform sideBets format if it exists
		const sideBets = rawSideBets
			? (Object.entries(rawSideBets).map(([type, data]) => ({
				type,
				amount: data.amount,
				payout: data.payout,
			})) as SideBet[])
			: undefined

		// Record the hand in the database
		const handId = await GameService.recordHand({
			sessionId,
			userId: user.id,
			betAmount,
			playerCards,
			dealerCards,
			actions,
			result,
			payout,
			sideBets,
		})

		// Determine transaction type based on result
		let transactionType: 'bet' | 'win' | 'loss' | 'push';
		if (result === 'blackjack' || result === 'win') {
			transactionType = 'win';
		} else if (result === 'push') {
			transactionType = 'push';
		} else {
			transactionType = 'loss';
		}

		// Create a description for the transaction
		const description = `${result.charAt(0).toUpperCase() + result.slice(1)} - Hand #${handId.slice(-6)}`;

		// First record the bet as a negative transaction
		await UserService.updateUserBalance(
			user.id,
			-betAmount,
			'bet',
			sessionId,
			`Bet - Hand #${handId.slice(-6)}`
		);

		// Then record the payout (if any) as a positive transaction
		if (payout > 0) {
			await UserService.updateUserBalance(
				user.id,
				payout,
				transactionType,
				sessionId,
				description
			);
		}

		return NextResponse.json({
			success: true,
			handId,
		})
	} catch (error) {
		console.error('Error recording hand:', error)
		return NextResponse.json({ error: 'Failed to record hand' }, { status: 500 })
	}
}
