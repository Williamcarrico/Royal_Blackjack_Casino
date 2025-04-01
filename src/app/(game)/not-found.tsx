import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/layout/button'

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-12 text-center">
			<h1 className="mb-4 text-6xl font-bold text-primary">404</h1>
			<h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
			<p className="max-w-md mb-8 text-muted-foreground">
				Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been removed,
				had its name changed, or is temporarily unavailable.
			</p>
			<Button asChild>
				<Link href="/">Return to Home</Link>
			</Button>
		</div>
	)
}
