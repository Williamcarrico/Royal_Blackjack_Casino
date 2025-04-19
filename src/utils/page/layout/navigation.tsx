import Link from 'next/link'
import { ReactNode } from 'react'

interface NavigationLinkProps {
	readonly href: string
	readonly children: ReactNode
	readonly className?: string
	readonly onClick?: () => void
}

export function NavigationLink({ href, children, className, onClick }: NavigationLinkProps) {
	return (
		<Link href={href} className={className} onClick={onClick}>
			{children}
		</Link>
	)
}
