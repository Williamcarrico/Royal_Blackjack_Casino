'use client'

import React from 'react'
import { motion, Variants } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { useNotifications } from '@/hooks/services/useNotifications'
import { NotificationType } from '@/types/notifications'

interface NotificationBadgeProps {
    /**
     * Optional specific notification type to show count for
     */
    readonly type?: NotificationType;

    /**
     * Override to show a specific count (otherwise pulls from store)
     */
    readonly count?: number;

    /**
     * Label text for screen readers
     */
    readonly label?: string;

    /**
     * CSS classes for customization
     */
    readonly className?: string;

    /**
     * Whether to show animation
     */
    readonly animate?: boolean;

    /**
     * Size variant
     */
    readonly size?: 'sm' | 'md' | 'lg';

    /**
     * Color variant
     */
    readonly variant?: 'default' | 'premium' | 'danger' | 'success' | 'info';

    /**
     * Hide badge when count is zero
     */
    readonly hideWhenZero?: boolean;

    /**
     * Max count to display before showing "+"
     */
    readonly maxCount?: number;

    /**
     * Whether to add a shadow glow effect
     */
    readonly glow?: boolean;
}

/**
 * Notification badge component that shows unread counts
 * Can be used standalone throughout the app
 */
export function NotificationBadge({
    type,
    count,
    label,
    className,
    animate = true,
    size = 'md',
    variant = 'default',
    hideWhenZero = true,
    maxCount = 99,
    glow = true,
}: NotificationBadgeProps) {
    // Get notification data from store
    const { unseenCount, filterByType } = useNotifications();

    // Get filtered count for specific type if needed
    const displayCount = count ?? (type
        ? filterByType(type).filter(n => n.status === 'unread').length
        : unseenCount);

    // Don't render if count is zero and hideWhenZero is true
    if (displayCount === 0 && hideWhenZero) {
        return null;
    }

    // Format the count for display (e.g., 100+ instead of 100)
    const formattedCount = displayCount > maxCount ? `${maxCount}+` : displayCount;

    // Get size classes based on size prop
    const sizeClasses = {
        sm: 'w-4 h-4 text-[10px]',
        md: 'w-5 h-5 text-xs',
        lg: 'w-6 h-6 text-sm'
    }[size];

    // Get variant classes based on variant prop
    const variantClasses = {
        default: 'bg-gradient-to-br from-red-500 to-red-700 text-white',
        premium: 'bg-gradient-to-br from-amber-400 to-amber-600 text-black',
        danger: 'bg-gradient-to-br from-red-600 to-red-800 text-white',
        success: 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white',
        info: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
    }[variant];

    // Get glow classes based on variant and glow prop
    const glowClasses = glow ? {
        default: 'shadow-[0_0_5px_rgba(239,68,68,0.5)]',
        premium: 'shadow-[0_0_5px_rgba(245,158,11,0.6)]',
        danger: 'shadow-[0_0_5px_rgba(220,38,38,0.5)]',
        success: 'shadow-[0_0_5px_rgba(16,185,129,0.5)]',
        info: 'shadow-[0_0_5px_rgba(59,130,246,0.5)]'
    }[variant] : '';

    // Animation variants
    const pulseVariants: Variants = {
        initial: { scale: 1, opacity: 0.9 },
        pulse: animate ? {
            scale: [1, 1.2, 1],
            opacity: [0.9, 1, 0.9],
            transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" }
        } : {}
    };

    // Generate accessibility label
    const ariaLabel = label || `${displayCount} unread ${type || 'notification'}${displayCount !== 1 ? 's' : ''}`;

    return (
        <motion.output
            variants={pulseVariants}
            initial="initial"
            animate="pulse"
            className={cn(
                "flex items-center justify-center font-semibold rounded-full",
                sizeClasses,
                variantClasses,
                glowClasses,
                className
            )}
            aria-label={ariaLabel}
        >
            {formattedCount}
        </motion.output>
    );
}

export default NotificationBadge;