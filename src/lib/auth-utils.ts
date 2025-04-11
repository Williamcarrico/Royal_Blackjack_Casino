/**
 * Client-side authentication utilities
 * These functions use the client-side Supabase client
 * to provide authentication functionality that works in both
 * App Router client components and Pages Router
 */
import { createClient } from './supabase/client'

/**
 * Get the current user session
 * @returns The current user session or null if not authenticated
 */
export async function getCurrentSession() {
    try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        return session
    } catch (error) {
        console.error('Error fetching session:', error)
        return null
    }
}

/**
 * Get the current user
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch (error) {
        console.error('Error fetching user:', error)
        return null
    }
}

/**
 * Sign out the current user
 * @returns True if sign out was successful, false otherwise
 */
export async function signOut() {
    try {
        const supabase = createClient()
        const { error } = await supabase.auth.signOut()
        return !error
    } catch (error) {
        console.error('Error signing out:', error)
        return false
    }
}