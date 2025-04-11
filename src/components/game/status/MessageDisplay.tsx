'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { AnimatePresence, motion } from 'framer-motion';

export type MessageType = 'info' | 'success' | 'warning' | 'error' | 'dealer' | 'player';

export interface MessageDisplayProps {
    message?: string | null;
    type?: MessageType;
    duration?: number;
    autoHide?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'solid' | 'outline' | 'ghost';
    centered?: boolean;
    withBackground?: boolean;
}

/**
 * MessageDisplay component for showing game status messages and announcements
 * Supports different message types, auto-hiding, and animation
 */
const MessageDisplay: React.FC<MessageDisplayProps> = ({
    message,
    type = 'info',
    duration = 5000,
    autoHide = false,
    className,
    size = 'md',
    variant = 'solid',
    centered = true,
    withBackground = true,
}) => {
    const [isVisible, setIsVisible] = useState(!!message);
    const [currentMessage, setCurrentMessage] = useState(message);

    // Update visibility when message changes
    useEffect(() => {
        if (message) {
            setCurrentMessage(message);
            setIsVisible(true);

            // Auto-hide message after duration
            if (autoHide) {
                const timer = setTimeout(() => {
                    setIsVisible(false);
                }, duration);

                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [message, autoHide, duration]);

    // Map message type to style
    const getMessageStyles = () => {
        const baseStyles = "font-bold rounded-lg flex items-center justify-center";

        // Size variations
        const sizeStyles = {
            sm: "text-sm py-1 px-3",
            md: "text-base py-2 px-4",
            lg: "text-lg py-3 px-6",
        };

        // Type-specific colors
        const typeStylesMap = {
            info: {
                solid: "bg-blue-600 text-white",
                outline: "border-2 border-blue-600 text-blue-600",
                ghost: "text-blue-600",
            },
            success: {
                solid: "bg-green-600 text-white",
                outline: "border-2 border-green-600 text-green-600",
                ghost: "text-green-600",
            },
            warning: {
                solid: "bg-yellow-500 text-white",
                outline: "border-2 border-yellow-500 text-yellow-500",
                ghost: "text-yellow-500",
            },
            error: {
                solid: "bg-red-600 text-white",
                outline: "border-2 border-red-600 text-red-600",
                ghost: "text-red-600",
            },
            dealer: {
                solid: "bg-amber-600 text-white",
                outline: "border-2 border-amber-600 text-amber-600",
                ghost: "text-amber-600",
            },
            player: {
                solid: "bg-purple-600 text-white",
                outline: "border-2 border-purple-600 text-purple-600",
                ghost: "text-purple-600",
            },
        };

        return cn(
            baseStyles,
            sizeStyles[size],
            typeStylesMap[type][variant],
            withBackground && variant === 'ghost' && 'bg-black/20 backdrop-blur-sm',
        );
    };

    // Animation variants
    const messageVariants = {
        initial: {
            opacity: 0,
            y: -20,
            scale: 0.95,
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 500,
                damping: 30
            }
        },
        exit: {
            opacity: 0,
            y: 20,
            scale: 0.95,
            transition: {
                duration: 0.2
            }
        }
    };

    if (!currentMessage) return null;

    return (
        <div className={cn(
            "relative overflow-hidden",
            centered && "flex justify-center",
            className
        )}>
            <AnimatePresence mode="wait">
                {isVisible && (
                    <motion.div
                        key={`message-${currentMessage}`}
                        className={getMessageStyles()}
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        role="alert"
                    >
                        {currentMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessageDisplay;