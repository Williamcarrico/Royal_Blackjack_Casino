/**
 * Supabase client for server environments (server components and API routes)
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase'

// Schema for preferences update
const preferencesSchema = z.object({
	theme: z.enum(['dark', 'light', 'system']).optional(),
	sound_enabled: z.boolean().optional(),
	animation_speed: z.enum(['slow', 'normal', 'fast']).optional(),
	bet_amount: z.number().min(1).max(1000).optional(),
})

export async function GET() {
	try {
		// Initialize Supabase client
		const supabase = await createServerClient()

		// Get user session
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user preferences from the database
		const { data: preferences, error } = await supabase
			.from('user_preferences')
			.select('*')
			.eq('user_id', session.user.id)
			.single()

		if (error) {
			// Check if it's a "not found" error
			if (error.code === 'PGRST116') {
				// Create default preferences if none exist
				const defaultPreferences = {
					user_id: session.user.id,
					theme: 'dark',
					sound_enabled: true,
					animation_speed: 'normal',
					bet_amount: 10,
				}

				const { data: newPreferences, error: insertError } = await supabase
					.from('user_preferences')
					.insert(defaultPreferences)
					.select()
					.single()

				if (insertError) {
					console.error('Error creating default preferences:', insertError)
					return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 })
				}

				return NextResponse.json({ preferences: newPreferences })
			}

			console.error('Error fetching preferences:', error)
			return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
		}

		return NextResponse.json({ preferences })
	} catch (error) {
		console.error('Unexpected error fetching preferences:', error)
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Parse and validate request body
		const body = await request.json()
		const validation = preferencesSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid request data', details: validation.error.format() },
				{ status: 400 }
			)
		}

		const updates = validation.data

		// Initialize Supabase client
		const supabase = await createServerClient()

		// Get user session
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Update user preferences in the database
		const { error } = await supabase
			.from('user_preferences')
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq('user_id', session.user.id)

		if (error) {
			console.error('Error updating preferences:', error)
			return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
		}

		return NextResponse.json({ message: 'Preferences updated successfully' }, { status: 200 })
	} catch (error) {
		console.error('Unexpected error in preferences update:', error)
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
	}
}
