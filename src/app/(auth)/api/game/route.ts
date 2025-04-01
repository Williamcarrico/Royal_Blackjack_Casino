import { NextRequest, NextResponse } from 'next/server'
import { GameService } from '@/services/supabase/game-service'
import { AuthService } from '@/services/supabase/auth-service'
import { GameStats } from '@/types/gameState'

/**
 * API route for creating a new game session
 */
export async function POST() {
	try {
		const { user, error } = await AuthService.getCurrentUser()

		if (!user || error) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
		}

		const userProfile = await AuthService.getUserProfile(user.id)

		if (!userProfile) {
			return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
		}

		// Create a new game session
		const sessionId = await GameService.createSession(user.id, userProfile.chips)

		return NextResponse.json({
			success: true,
			sessionId,
			chips: userProfile.chips,
		})
	} catch (error) {
		console.error('Error creating game session:', error)
		return NextResponse.json({ error: 'Failed to create game session' }, { status: 500 })
	}
}

/**
 * API route for ending a game session and saving results
 */
export async function PUT(request: NextRequest) {
	try {
		const { user, error } = await AuthService.getCurrentUser()

		if (!user || error) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
		}

		const { sessionId, gameStats } = (await request.json()) as {
			sessionId: string
			gameStats: GameStats
		}

		// Update the game session with final stats
		await GameService.updateSession(sessionId, gameStats)

		// Update user chips
		await AuthService.updateUserProfile(user.id, { chips: gameStats.endingChips })

		return NextResponse.json({
			success: true,
			message: 'Game session completed successfully',
		})
	} catch (error) {
		console.error('Error ending game session:', error)
		return NextResponse.json({ error: 'Failed to end game session' }, { status: 500 })
	}
}

/**
 * API route for retrieving user game data
 */
export async function GET() {
	try {
		const { user, error } = await AuthService.getCurrentUser()

		if (!user || error) {
			return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
		}

		const userProfile = await AuthService.getUserProfile(user.id)

		if (!userProfile) {
			return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
		}

		// Get recent sessions
		const sessions = await GameService.getUserSessions(user.id)

		return NextResponse.json({
			chips: userProfile.chips,
			sessions: sessions.slice(0, 10), // Limit to 10 most recent sessions
		})
	} catch (error) {
		console.error('Error getting user game data:', error)
		return NextResponse.json({ error: 'Failed to retrieve game data' }, { status: 500 })
	}
}
