'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/utils'
import { Separator } from '@/components/ui/separator'

export interface AuthFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    showLinks?: boolean
    showLegal?: boolean
    showSeparator?: boolean
    variant?: 'default' | 'minimal' | 'centered'
    year?: number
    // Support for single link
    link?: string
    label?: string
    // Support for multiple links
    links?: Array<{ label: string; href: string }>
}

const AuthFooter = ({
    className,
    showLinks = true,
    showLegal = true,
    showSeparator = true,
    variant = 'default',
    year = new Date().getFullYear(),
    link,
    label,
    links,
    ...props
}: AuthFooterProps) => {
    return (
        <footer className={cn('w-full mt-8 py-4', className)} {...props}>
            {showSeparator && <Separator className="mb-4" />}

            <div className={cn(
                'flex text-center text-sm text-muted-foreground',
                variant === 'default' ? 'flex-col space-y-2 md:flex-row md:justify-between md:space-y-0' : '',
                variant === 'minimal' ? 'justify-center' : '',
                variant === 'centered' ? 'flex-col items-center space-y-3' : ''
            )}>
                {showLinks && (
                    <div className={cn(
                        'flex gap-4',
                        variant === 'centered' ? 'justify-center' : ''
                    )}>
                        {link && (
                            <Link
                                href={link}
                                className="transition-colors hover:underline hover:text-primary"
                                tabIndex={0}
                                aria-label={label}
                            >
                                {label}
                            </Link>
                        )}
                        {links?.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="transition-colors hover:underline hover:text-primary"
                                tabIndex={0}
                                aria-label={item.label}
                            >
                                {item.label}
                            </Link>
                        ))}
                        {!link && !links && (
                            <>
                                <Link
                                    href="/terms"
                                    className="transition-colors hover:underline hover:text-primary"
                                    tabIndex={0}
                                    aria-label="Terms of Service"
                                >
                                    Terms
                                </Link>
                                <Link
                                    href="/privacy"
                                    className="transition-colors hover:underline hover:text-primary"
                                    tabIndex={0}
                                    aria-label="Privacy Policy"
                                >
                                    Privacy
                                </Link>
                                <Link
                                    href="/support"
                                    className="transition-colors hover:underline hover:text-primary"
                                    tabIndex={0}
                                    aria-label="Get Support"
                                >
                                    Support
                                </Link>
                            </>
                        )}
                    </div>
                )}

                {showLegal && (
                    <div className={cn(
                        variant === 'centered' ? 'text-center' : '',
                        variant === 'default' && !showLinks ? 'md:ml-auto' : ''
                    )}>
                        <p>
                            © {year} Royal Blackjack Casino. All rights reserved.
                        </p>
                        <p className="mt-1 text-xs">
                            You must be 21 years or older to play. Please gamble responsibly.
                        </p>
                    </div>
                )}
            </div>

            {variant === 'centered' && (
                <div className="flex justify-center mt-4">
                    <div className="flex space-x-4">
                        <a
                            href="https://twitter.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors text-muted-foreground hover:text-primary"
                            tabIndex={0}
                            aria-label="Twitter"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                        </a>
                        <a
                            href="https://facebook.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors text-muted-foreground hover:text-primary"
                            tabIndex={0}
                            aria-label="Facebook"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                        </a>
                        <a
                            href="https://instagram.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-colors text-muted-foreground hover:text-primary"
                            tabIndex={0}
                            aria-label="Instagram"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}
        </footer>
    )
}

export { AuthFooter }