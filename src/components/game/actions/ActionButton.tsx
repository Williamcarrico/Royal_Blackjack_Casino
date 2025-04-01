'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import {
    HandThumbUpIcon,
    HandRaisedIcon,
    PlusIcon,
    ArrowsRightLeftIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export type GameAction = 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'insurance' | 'even-money' | 'continue' | 'deal' | 'rebet' | 'custom';

export interface ActionButtonProps {
    action: GameAction;
    label?: string;
    active?: boolean;
    disabled?: boolean;
    recommended?: boolean;
    showIcon?: boolean;
    iconOnly?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
    onClick?: () => void;
    className?: string;
    customIcon?: React.ReactNode;
    tooltipText?: string;
    shortcut?: string;
}

const ActionButton = ({
    action,
    label,
    active = false,
    disabled = false,
    recommended = false,
    showIcon = true,
    iconOnly = false,
    size = 'md',
    variant = 'default',
    onClick,
    className = '',
    customIcon,
    tooltipText,
    shortcut,
}: ActionButtonProps) => {
    // Action-specific default labels
    const getDefaultLabel = (action: GameAction) => {
        switch (action) {
            case 'hit': return 'Hit';
            case 'stand': return 'Stand';
            case 'double': return 'Double';
            case 'split': return 'Split';
            case 'surrender': return 'Surrender';
            case 'insurance': return 'Insurance';
            case 'even-money': return 'Even Money';
            case 'continue': return 'Continue';
            case 'deal': return 'Deal';
            case 'rebet': return 'Rebet';
            case 'custom': return 'Action';
            default: return 'Action';
        }
    };

    // Use provided label or default
    const buttonLabel = label ?? getDefaultLabel(action);

    // Get the appropriate icon based on the action
    const getIcon = (action: GameAction) => {
        if (customIcon) return customIcon;

        switch (action) {
            case 'hit':
                return <HandThumbUpIcon className="w-5 h-5" />;
            case 'stand':
                return <HandRaisedIcon className="w-5 h-5" />;
            case 'double':
                return <PlusIcon className="w-5 h-5" />;
            case 'split':
                return <ArrowsRightLeftIcon className="w-5 h-5" />;
            case 'surrender':
                return <ShieldExclamationIcon className="w-5 h-5" />;
            default:
                return null;
        }
    };

    // Get appropriate variant classes
    const getVariantClasses = (variant: string) => {
        switch (variant) {
            case 'primary':
                return 'bg-primary hover:bg-primary/90 text-primary-foreground';
            case 'secondary':
                return 'bg-secondary hover:bg-secondary/90 text-secondary-foreground';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            case 'warning':
                return 'bg-amber-500 hover:bg-amber-600 text-white';
            case 'danger':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'outline':
                return 'bg-transparent border border-foreground/20 hover:bg-foreground/10 text-foreground';
            default:
                return 'bg-slate-800 hover:bg-slate-700 text-white';
        }
    };

    // Get size classes
    const getSizeClasses = (size: string) => {
        switch (size) {
            case 'sm':
                return 'px-2 py-1 text-xs';
            case 'lg':
                return 'px-6 py-3 text-base';
            default:
                return 'px-4 py-2 text-sm';
        }
    };

    // Pulse animation for recommended actions
    const pulseAnimation = recommended && !disabled ? {
        animate: {
            scale: [1, 1.05, 1],
            boxShadow: [
                '0 0 0 0 rgba(79, 209, 197, 0)',
                '0 0 0 4px rgba(79, 209, 197, 0.3)',
                '0 0 0 0 rgba(79, 209, 197, 0)'
            ],
            transition: {
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop' as const
            }
        }
    } : {};

    // Handle keyboard interaction for accessibility
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    return (
        <div className={cn('relative', className)}>
            <motion.div
                className="relative"
                {...pulseAnimation}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
            >
                <Button
                    className={cn(
                        'rounded-lg font-medium transition-all duration-200',
                        'flex items-center justify-center gap-2',
                        getVariantClasses(variant),
                        getSizeClasses(size),
                        active && 'ring-2 ring-white/50',
                        recommended && !disabled && 'ring-2 ring-primary',
                        iconOnly && 'aspect-square',
                        className
                    )}
                    disabled={disabled}
                    onClick={onClick}
                    aria-label={tooltipText ?? buttonLabel}
                    data-action={action}
                    tabIndex={disabled ? -1 : 0}
                    onKeyDown={handleKeyDown}
                >
                    {showIcon && getIcon(action)}
                    {!iconOnly && (
                        <span className="font-bold">{buttonLabel}</span>
                    )}
                </Button>
            </motion.div>

            {/* Shortcut indicator */}
            {shortcut && (
                <div className="absolute -right-1 -bottom-1 bg-black/80 rounded-md px-1 py-0.5 text-[10px] text-white">
                    {shortcut}
                </div>
            )}

            {/* Tooltip */}
            {tooltipText && (
                <div className="absolute z-10 mt-1 transform -translate-x-1/2 top-full left-1/2">
                    <div className="px-2 py-1 text-xs text-white transition-opacity rounded opacity-0 bg-black/90 whitespace-nowrap group-hover:opacity-100">
                        {tooltipText}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionButton;