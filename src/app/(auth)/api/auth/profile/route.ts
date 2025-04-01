import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Schema for profile update
const profileSchema = z.object({
	username: z.string().min(3).max(20).optional(),
	display_name: z.string().nullable().optional(),
	avatar_url: z.string().url().nullable().optional(),
	bio: z.string().max(500).nullable().optional(),
	chips: z.number().optional(),
	// Stats are not directly updatable through this endpoint
})

export async function GET() {
	try {
		// Initialize Supabase client
		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					get(name) {
						return cookieStore.get(name)?.value
					},
					set() { },
					remove() { },
				},
			}
		)

		// Get user session
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user profile from the database
		const { data: user, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', session.user.id)
			.single()

		if (error) {
			console.error('Error fetching profile:', error)
			return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
		}

		// Return the user profile
		return NextResponse.json({ user })
	} catch (error) {
		console.error('Unexpected error fetching profile:', error)
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		// Parse and validate request body
		const body = await request.json()
		const validation = profileSchema.safeParse(body)

		if (!validation.success) {
			return NextResponse.json(
				{ error: 'Invalid request data', details: validation.error.format() },
				{ status: 400 }
			)
		}

		const updates = validation.data

		// Initialize Supabase client
		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					get(name) {
						return cookieStore.get(name)?.value
					},
					set() { },
					remove() { },
				},
			}
		)

		// Get user session
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (!session) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Update user profile in the database
		const { error } = await supabase
			.from('users')
			.update({
				...updates,
				updated_at: new Date().toISOString(),
			})
			.eq('id', session.user.id)

		if (error) {
			console.error('Error updating profile:', error)
			return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
		}

		return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 })
	} catch (error) {
		console.error('Unexpected error in profile update:', error)
		return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
	}
}
