import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/services/supabase/auth-service'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
	try {
		// Get user data from request
		const { email, username } = await request.json()

		// Validate required fields
		if (!email || !username) {
			return NextResponse.json({ error: 'Email and username are required' }, { status: 400 })
		}

		// Get the current authenticated user from Supabase Auth
		const { user, error } = await AuthService.getCurrentUser()

		if (!user || error) {
			return NextResponse.json(
				{ error: 'Not authenticated. Please sign up first.' },
				{ status: 401 }
			)
		}

		// Check if a profile already exists for this user
		const existingProfile = await AuthService.getUserProfile(user.id)

		if (existingProfile) {
			return NextResponse.json({ error: 'User profile already exists' }, { status: 400 })
		}

		// Manually create the user profile using the server client
		const supabase = await createServerClient()

		// Check if username is already taken
		const { data: existingUsers, error: usernameError } = await supabase
			.from('user_profiles')
			.select('id')
			.eq('username', username)
			.limit(1)

		if (usernameError) {
			console.error('Error checking username:', JSON.stringify(usernameError))
			return NextResponse.json({ error: 'Failed to verify username availability' }, { status: 500 })
		}

		if (existingUsers && existingUsers.length > 0) {
			return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
		}

		// Manually create the user profile using the server client
		const { error: insertError } = await supabase.from('user_profiles').insert({
			id: user.id,
			username,
			email,
			balance: 1000, // Default starting balance
			total_games: 0,
			total_hands: 0,
			total_wins: 0,
			total_losses: 0,
			total_pushes: 0,
			total_blackjacks: 0,
		})

		if (insertError) {
			console.error('Error creating profile:', insertError)
			return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 })
		}

		return NextResponse.json({
			success: true,
			message: 'User registered successfully',
		})
	} catch (error) {
		console.error('Error in registration:', error)
		return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
	}
}
