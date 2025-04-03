'use client';

import React, { memo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, useDragControls, useMotionValue, useTransform, AnimatePresence, Variants } from 'framer-motion';

export type ChipValue = 1 | 5 | 10 | 25 | 50 | 100 | 500 | 1000 | 5000 | 10000;
export type ChipSize = 'sm' | 'md' | 'lg';

export const CHIP_COLORS: Record<ChipValue, { bg: string; border: string; text: string; dot: string }> = {
    1: {
        bg: 'bg-white',
        border: 'border-gray-300',
        text: 'text-gray-900',
        dot: 'bg-gray-200'
    },
    5: {
        bg: 'bg-red-600',
        border: 'border-red-800',
        text: 'text-white',
        dot: 'bg-red-500'
    },
    10: {
        bg: 'bg-blue-600',
        border: 'border-blue-800',
        text: 'text-white',
        dot: 'bg-blue-500'
    },
    25: {
        bg: 'bg-green-600',
        border: 'border-green-800',
        text: 'text-white',
        dot: 'bg-green-500'
    },
    50: {
        bg: 'bg-orange-500',
        border: 'border-orange-700',
        text: 'text-white',
        dot: 'bg-orange-400'
    },
    100: {
        bg: 'bg-black',
        border: 'border-gray-800',
        text: 'text-white',
        dot: 'bg-gray-700'
    },
    500: {
        bg: 'bg-purple-600',
        border: 'border-purple-800',
        text: 'text-white',
        dot: 'bg-purple-500'
    },
    1000: {
        bg: 'bg-amber-500',
        border: 'border-amber-700',
        text: 'text-white',
        dot: 'bg-amber-400'
    },
    5000: {
        bg: 'bg-pink-600',
        border: 'border-pink-800',
        text: 'text-white',
        dot: 'bg-pink-500'
    },
    10000: {
        bg: 'bg-gradient-to-br from-emerald-500 to-blue-500',
        border: 'border-teal-800',
        text: 'text-white',
        dot: 'bg-teal-400'
    }
};

export interface ChipProps {
    value: ChipValue;
    count?: number;
    stacked?: boolean;
    className?: string;
    style?: React.CSSProperties;
    size?: ChipSize;
    interactive?: boolean;
    selected?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    appearWithAnimation?: boolean;
    initialAnimation?: boolean;
    index?: number;
    draggable?: boolean;
    onDragEnd?: (position: { x: number; y: number }) => void;
    dropTargets?: string[];
    onDrop?: (targetId: string) => void;
    stackingOffset?: number;
    renderLimit?: number;
}

// Memoized decorative dot component to reduce re-renders
const ChipDot = memo(({ color, idx, size }: { color: string; idx: number; size: ChipSize }) => {
    const sizeToClassMap = {
        'sm': 'w-1 h-1',
        'md': 'w-1.5 h-1.5',
        'lg': 'w-2 h-2'
    };

    const dotSizeClass = sizeToClassMap[size] || 'w-2 h-2';

    return (
        <div
            className={cn(
                'absolute rounded-full',
                color,
                dotSizeClass,
                'chip-dot'
            )}
            data-rotation={idx * 45}
            data-size={size}
        />
    );
});

ChipDot.displayName = 'ChipDot';

// Memoized stack chip component to optimize rendering
const StackedChipLayer = memo(({
    idx,
    value,
    colors,
    sizeClasses,
    size,
    disabled,
    variants,
    initialAnimation,
    stackingOffset = 2
}: {
    idx: number;
    value: ChipValue;
    colors: { bg: string; border: string; text: string; dot: string };
    sizeClasses: Record<string, string>;
    size: 'sm' | 'md' | 'lg';
    disabled: boolean;
    variants: Variants;
    initialAnimation: boolean;
    stackingOffset?: number;
}) => (
    <motion.div
        key={`${value}-${idx}`}
        className={cn(
            'absolute rounded-full shadow-lg border-2',
            colors.bg,
            colors.border,
            sizeClasses[size],
            disabled && 'opacity-50',
            'stacked-chip-layer'
        )}
        initial={initialAnimation ? 'initial' : false}
        animate={initialAnimation ? 'animate' : undefined}
        custom={idx}
        variants={variants}
        data-idx={idx}
        data-stacking-offset={stackingOffset}
    />
));

StackedChipLayer.displayName = 'StackedChipLayer';

// Helper function to determine if chip is interactive
const isChipInteractive = (interactive: boolean, draggable: boolean, disabled: boolean): boolean => {
    return (interactive || draggable) && !disabled;
};

// Helper functions for animation state determination
const getAppearAnimation = (): 'initial' => {
    return 'initial';
};

const getDefaultAnimation = (): false => {
    return false;
};

const getInitialAnimationValue = (appearWithAnimation: boolean, initialAnimation: boolean): boolean | 'initial' => {
    if (appearWithAnimation || initialAnimation) {
        return getAppearAnimation();
    }
    return getDefaultAnimation();
};

// Determine the animation state for the chip
const determineAnimationState = (
    selected: boolean,
    appearWithAnimation: boolean,
    isDragging: boolean
): string | undefined => {
    if (selected) {
        return 'selected';
    }
    if (appearWithAnimation) {
        return 'animate';
    }
    if (isDragging) {
        return 'drag';
    }
    return undefined;
};

const Chip = ({
    value,
    count = 1,
    stacked = false,
    className = '',
    style,
    size = 'md',
    interactive = false,
    selected = false,
    disabled = false,
    onClick,
    appearWithAnimation = false,
    initialAnimation = false,
    index = 0,
    draggable = false,
    onDragEnd,
    dropTargets = [],
    onDrop,
    stackingOffset = 2,
    renderLimit = 5,
}: ChipProps) => {
    // State for drag-and-drop functionality
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
    const dragControls = useDragControls();
    const chipRef = useRef<HTMLDivElement>(null);

    // Motion values for tracking drag position
    const x = useMotionValue(dragPosition.x);
    const y = useMotionValue(dragPosition.y);

    // Apply dragPosition to motion values when it changes
    useEffect(() => {
        x.set(dragPosition.x);
        y.set(dragPosition.y);
    }, [dragPosition.x, dragPosition.y, x, y]);

    // Create a 3D-like rotation effect during dragging
    const rotateX = useTransform(y, [-100, 100], [10, -10]);
    const rotateY = useTransform(x, [-100, 100], [-10, 10]);

    // Get the chip colors based on the value
    const colors = CHIP_COLORS[value] || CHIP_COLORS[1];

    // Determine size classes
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-base'
    };

    // Animation variants
    const stackVariants = {
        initial: {
            y: -20,
            x: 0,
            opacity: 0,
            scale: 0.8,
            rotateZ: Math.random() * 10 - 5
        },
        animate: (i: number) => ({
            y: 0,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateZ: (i % 2 === 0) ? i : -i, // Alternate rotation for more realistic stack
            transition: {
                delay: i * 0.05,
                duration: 0.3,
                type: 'spring',
                stiffness: 200
            }
        }),
        hover: {
            y: -5,
            scale: 1.05,
            transition: {
                duration: 0.2
            }
        },
        selected: {
            y: -8,
            scale: 1.1,
            boxShadow: '0 0 0 2px rgba(255,255,255,0.8)',
            transition: {
                duration: 0.2
            }
        },
        drag: {
            zIndex: 50,
            transition: {
                duration: 0.2
            }
        }
    };

    // Determine the animation state for the chip
    const animationState = determineAnimationState(selected, appearWithAnimation, isDragging);

    // Handle keyboard interactions for accessibility
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    // Handle drag start
    const handleDragStart = () => {
        setIsDragging(true);
    };

    // Handle validating drop targets
    const handleTargetDrop = useCallback((targetId: string, point: { x: number, y: number }) => {
        const element = document.getElementById(targetId);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        if (
            point.x >= rect.left &&
            point.x <= rect.right &&
            point.y >= rect.top &&
            point.y <= rect.bottom
        ) {
            onDrop?.(targetId);
            return true;
        }
        return false;
    }, [onDrop]);

    // Handle drag end
    const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number }, point: { x: number; y: number } }) => {
        setIsDragging(false);

        // Update dragPosition with the final position after drag
        const newPosition = { x: info.offset.x, y: info.offset.y };
        setDragPosition(newPosition);

        // Update motion values directly for immediate visual feedback
        x.set(newPosition.x);
        y.set(newPosition.y);

        if (onDragEnd) {
            onDragEnd({ x: info.point.x, y: info.point.y });
        }

        // Check if chip was dropped on a valid target
        if (dropTargets.length > 0 && onDrop) {
            dropTargets.forEach(targetId => {
                handleTargetDrop(targetId, info.point);
            });
        }
    }, [onDragEnd, dropTargets, handleTargetDrop, x, y, onDrop]);

    // Extract badge size classes from nested ternary
    const badgeSizeLookup = {
        'sm': 'w-4 h-4 text-[8px]',
        'md': 'w-5 h-5 text-[10px]',
        'lg': 'w-6 h-6 text-xs'
    };
    const badgeSizeClasses = badgeSizeLookup[size] || 'w-6 h-6 text-xs';

    // Extract value text size classes from nested ternary
    const valueTextSizeLookup = {
        'sm': 'text-xs',
        'md': 'text-sm',
        'lg': 'text-base'
    };
    const valueTextSizeClass = valueTextSizeLookup[size] || 'text-base';

    // Actual number of chips to render in the stack
    const chipsToRender = Math.min(count, renderLimit);

    // Compute derived values to reduce complexity in JSX
    const isInteractive = isChipInteractive(interactive, draggable, disabled);
    const initialAnimationValue = getInitialAnimationValue(appearWithAnimation, initialAnimation);
    const showHoverAnimation = interactive && !disabled ? 'hover' : undefined;
    const clickHandler = !draggable && !disabled ? onClick : undefined;

    return (
        <div
            className={cn('relative', stacked && 'stack-container', className)}
            style={style}
            ref={chipRef}
            data-stacked={stacked}
            data-count={count}
            data-stacking-offset={stackingOffset}
            data-render-limit={renderLimit}
        >
            {/* Render multiple chips for stacks with optimized rendering */}
            {stacked && count > 1 && (
                <AnimatePresence>
                    {Array.from({ length: chipsToRender }).map((_, idx) => (
                        <StackedChipLayer
                            key={`stack-${value}-${idx}-${size}-${count}`}
                            idx={idx}
                            value={value}
                            colors={colors}
                            sizeClasses={sizeClasses}
                            size={size}
                            disabled={disabled}
                            variants={stackVariants}
                            initialAnimation={initialAnimation}
                            stackingOffset={stackingOffset}
                        />
                    ))}
                </AnimatePresence>
            )}

            {/* Main chip or single chip with drag functionality */}
            <motion.button
                type="button"
                className={cn(
                    'flex items-center justify-center rounded-full shadow-lg border-2',
                    'select-none',
                    colors.bg,
                    colors.border,
                    colors.text,
                    'font-bold',
                    sizeClasses[size],
                    isInteractive && 'cursor-pointer',
                    disabled && 'opacity-50',
                    isDragging && 'z-50',
                    'main-chip'
                )}
                initial={initialAnimationValue}
                animate={animationState}
                variants={stackVariants}
                custom={index}
                whileHover={showHoverAnimation}
                whileDrag="drag"
                drag={draggable && !disabled}
                dragControls={draggable ? dragControls : undefined}
                dragConstraints={chipRef}
                dragElastic={0.1}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onClick={clickHandler}
                disabled={disabled}
                onKeyDown={handleKeyDown}
                aria-label={`${value} chip` + (count > 1 ? `, ${count} chips` : '')}
                data-dragging={isDragging ? "true" : "false"}
                data-draggable={draggable ? "true" : "false"}
                style={{
                    x,
                    y,
                    rotateX: draggable ? rotateX : 0,
                    rotateY: draggable ? rotateY : 0,
                }}
            >
                {/* Inner ring */}
                <div className={cn(
                    'absolute inset-0 m-1 rounded-full border border-white/30',
                    'flex items-center justify-center'
                )}>
                    {/* Chip value */}
                    <span className={cn(
                        'relative z-10 font-bold',
                        'flex items-center justify-center',
                        valueTextSizeClass
                    )}>
                        {value}
                    </span>
                </div>

                {/* Decorative dots with memoization */}
                {[...Array(8)].map((_, idx) => (
                    <ChipDot key={`dot-${value}-${idx}-${size}`} color={colors.dot} idx={idx} size={size} />
                ))}
            </motion.button>

            {/* Count badge for stacked chips */}
            {stacked && count > 1 && (
                <div className="absolute top-0 right-0 z-30 transform translate-x-1/4 -translate-y-1/4">
                    <div className={cn(
                        'flex items-center justify-center rounded-full',
                        'bg-black/80 text-white font-bold',
                        'border-2 border-white',
                        badgeSizeClasses
                    )}>
                        {count}
                    </div>
                </div>
            )}
        </div>
    );
};

// Export the memoized component for better performance
export default memo(Chip);