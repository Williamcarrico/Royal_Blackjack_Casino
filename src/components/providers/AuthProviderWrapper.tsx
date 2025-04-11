'use client';

import { AuthProvider } from '@/contexts/auth-context';

/**
 * Wrapper component for the AuthProvider to enable 'use client' directive
 * while keeping the context implementation more readable
 */
export default function AuthProviderWrapper({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <AuthProvider>{children}</AuthProvider>;
}