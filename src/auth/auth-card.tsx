'use client'

import React from 'react'
import { cn } from '@/lib/utils/utils'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { VariantProps, cva } from 'class-variance-authority'
import { motion } from 'framer-motion'

// Define card variants for different auth scenarios
const authCardVariants = cva(
    'w-full mx-auto shadow-lg border-border',
    {
        variants: {
            size: {
                default: 'max-w-md',
                sm: 'max-w-sm',
                lg: 'max-w-lg',
            },
            variant: {
                default: '',
                premium: 'bg-gradient-to-tr from-muted/50 to-card border-primary/20',
                bordered: 'border-2',
            },
        },
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
    }
)

export interface AuthCardProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof authCardVariants> {
    title: string
    description?: string
    footer?: React.ReactNode
    showAnimation?: boolean
    logoPosition?: 'top' | 'header'
    headerAction?: React.ReactNode
}

const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
    ({
        className,
        title,
        description,
        footer,
        children,
        size,
        variant,
        showAnimation = true,
        logoPosition = 'top',
        headerAction,
        ...props
    }, ref) => {
        const CardComponent = showAnimation ? motion.div : React.Fragment
        const animationProps = showAnimation
            ? {
                initial: { opacity: 0, y: 10 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3 },
            }
            : {}

        return (
            <CardComponent {...animationProps}>
                <Card
                    className={cn(authCardVariants({ size, variant, className }))}
                    ref={ref}
                    {...props}
                >
                    {logoPosition === 'top' && (
                        <div className="flex justify-center mt-6 mb-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-6 h-6 text-primary"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M2 7h20" />
                                    <path d="M20 7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2" />
                                    <path d="M17 2a2 2 0 0 0-2 2v3h6V4a2 2 0 0 0-2-2h-2z" />
                                    <path d="M7 2a2 2 0 0 0-2 2v3h6V4a2 2 0 0 0-2-2H7z" />
                                    <rect x="9" y="12" width="6" height="6" />
                                </svg>
                            </div>
                        </div>
                    )}

                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-between">
                            {logoPosition === 'header' && (
                                <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-primary"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M2 7h20" />
                                        <path d="M20 7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2" />
                                        <path d="M17 2a2 2 0 0 0-2 2v3h6V4a2 2 0 0 0-2-2h-2z" />
                                        <path d="M7 2a2 2 0 0 0-2 2v3h6V4a2 2 0 0 0-2-2H7z" />
                                        <rect x="9" y="12" width="6" height="6" />
                                    </svg>
                                </div>
                            )}
                            <div className="flex-1">
                                <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                                {description && (
                                    <CardDescription className="mt-1">{description}</CardDescription>
                                )}
                            </div>
                            {headerAction && (
                                <div>{headerAction}</div>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-3">
                        {children}
                    </CardContent>

                    {footer && (
                        <CardFooter className="flex justify-center p-6 border-t">
                            {footer}
                        </CardFooter>
                    )}
                </Card>
            </CardComponent>
        )
    }
)

AuthCard.displayName = 'AuthCard'

export { AuthCard }