import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface UserProfile {
    id: string
    email: string
    username: string
    chips: number
    created_at: string
}

export class AuthService {
    /**
     * Get the current authenticated user
     */
    static async getCurrentUser() {
        try {
            const supabase = createClient()
            const { data: { user }, error } = await supabase.auth.getUser()
            return { user, error }
        } catch (error) {
            console.error('Error getting current user:', error)
            return { user: null, error }
        }
    }

    /**
     * Get user profile data
     */
    static async getUserProfile(userId: string) {
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('Error fetching user profile:', error)
                return null
            }

            return data as UserProfile
        } catch (error) {
            console.error('Error in getUserProfile:', error)
            return null
        }
    }

    /**
     * Update user profile data
     */
    static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId)

            return !error
        } catch (error) {
            console.error('Error updating user profile:', error)
            return false
        }
    }
}