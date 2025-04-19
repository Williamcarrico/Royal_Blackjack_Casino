'use client';

import React, { memo, useRef, useState, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, useDragControls, useMotionValue, useTransform, AnimatePresence, Variants } from 'framer-motion';
import type { ChipValue, ChipSize } from '@types/uiTypes';
import {
    CHIP_COLORS,
    CHIP_SIZE_CLASSES,
    CHIP_BADGE_SIZE_CLASSES,
    CHIP_VALUE_TEXT_SIZE_CLASSES,
    getChipColorByValue
} from '@/lib/constants/chips';

export interface ChipProps {
    value: ChipValue;
    count?: number;
    stacked?: boolean;
    className?: string;
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
    sizeClasses: string;
    size: ChipSize;
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
            sizeClasses,
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

    // Update data attributes for CSS to use
    useEffect(() => {
        if (chipRef.current) {
            chipRef.current.style.setProperty('--motion-x', `${x.get()}px`);
            chipRef.current.style.setProperty('--motion-y', `${y.get()}px`);
            chipRef.current.style.setProperty('--motion-rotate-x', `${rotateX.get()}deg`);
            chipRef.current.style.setProperty('--motion-rotate-y', `${rotateY.get()}deg`);
        }
    }, [x, y, rotateX, rotateY]);

    // Get the chip colors based on the value
    const colors = getChipColorByValue(value);

    // Get the size class from constants
    const sizeClasses = CHIP_SIZE_CLASSES[size];

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

    // Get badge size classes
    const badgeSizeClasses = CHIP_BADGE_SIZE_CLASSES[size];

    // Get value text size classes
    const valueTextSizeClass = CHIP_VALUE_TEXT_SIZE_CLASSES[size];

    // Actual number of chips to render in the stack
    const chipsToRender = Math.min(count, renderLimit);

    // Compute derived values to reduce complexity in JSX
    const isInteractive = isChipInteractive(interactive, draggable, disabled);
    const initialAnimationValue = getInitialAnimationValue(appearWithAnimation, initialAnimation);
    const showHoverAnimation = interactive && !disabled ? 'hover' : undefined;
    const clickHandler = !draggable && !disabled ? onClick : undefined;

    return (
        <div
            className={cn('relative chip-container', stacked && 'stack-container', className)}
            ref={chipRef}
            data-stacked={stacked}
            data-count={count}
            data-stacking-offset={stackingOffset}
            data-render-limit={renderLimit}
            data-chip-value={value}
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
                    'select-none main-chip-element',
                    colors.bg,
                    colors.border,
                    colors.text,
                    'font-bold',
                    sizeClasses,
                    isInteractive && 'cursor-pointer',
                    disabled && 'opacity-50',
                    isDragging && 'z-50 chip-dragging',
                    draggable && !disabled && 'chip-draggable',
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