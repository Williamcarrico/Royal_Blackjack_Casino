import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase'

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         * - api/auth (auth routes)
         * - auth (auth pages)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api/auth|auth).*)',
    ],
}

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create a Supabase client specifically for middleware
    const supabase = createMiddlewareClient(request, response)

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Redirect unauthenticated users to login for protected routes
    const protectedRoutes = ['/dashboard', '/profile', '/settings']
    const isProtectedRoute = protectedRoutes.some(route =>
        request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute && !session) {
        const redirectUrl = new URL('/auth/sign-in', request.url)
        // Add the current URL as a redirect parameter
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
    }

    // For non-protected routes, just pass the request through
    return response
}