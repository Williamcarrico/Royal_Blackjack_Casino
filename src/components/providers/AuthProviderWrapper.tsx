'use client';

import { AuthProvider } from '@/lib/context/AuthContext';

export default function AuthProviderWrapper({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return <AuthProvider>{children}</AuthProvider>;
}