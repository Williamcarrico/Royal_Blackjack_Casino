'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface MessageDisplayProps {
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    className?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
    centered?: boolean;
    transparent?: boolean;
}

const MessageDisplay = ({
    message,
    type = 'info',
    duration = 3000,
    className = '',
    showIcon = true,
    size = 'md',
    centered = true,
    transparent = false,
}: MessageDisplayProps) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
            }, duration);

            return () => clearTimeout(timer);
        }
        return undefined; // Explicit return for when duration is falsy or zero
    }, [duration, message]);

    // Determine the background color based on the message type
    const getBgColor = () => {
        const colorMap = {
            info: transparent ? 'bg-blue-500/70' : 'bg-blue-600',
            success: transparent ? 'bg-green-500/70' : 'bg-green-600',
            warning: transparent ? 'bg-amber-500/70' : 'bg-amber-600',
            error: transparent ? 'bg-red-500/70' : 'bg-red-600'
        };

        return colorMap[type];
    };

    // Get the icon for the message type
    const getIcon = () => {
        switch (type) {
            case 'info':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'success':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
            case 'error':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    // Determine sizing classes
    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    // Animation variants
    const messageVariants = {
        initial: {
            opacity: 0,
            y: -20,
            scale: 0.9
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.9,
            transition: {
                duration: 0.2
            }
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    key={`message-${message}`}
                    className={cn(
                        'rounded-lg shadow-lg backdrop-blur-sm',
                        'flex items-center',
                        'text-white font-medium',
                        getBgColor(),
                        sizeClasses[size],
                        centered && 'justify-center',
                        className
                    )}
                    variants={messageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    role="alert"
                    aria-live="assertive"
                >
                    {showIcon && (
                        <span className="mr-2">
                            {getIcon()}
                        </span>
                    )}
                    <span>{message}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MessageDisplay;