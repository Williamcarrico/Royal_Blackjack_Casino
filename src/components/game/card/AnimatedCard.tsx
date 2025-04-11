'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import { type CardAnimationType } from '@/hooks/game/useCardAnimations';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardStyle = 'modern' | 'classic' | 'retro' | 'minimal';

export interface AnimatedCardProps {
    id: string;
    suit?: Suit;
    rank?: Rank;
    faceDown?: boolean;
    dealt?: boolean;
    style?: React.CSSProperties;
    position?: { x: number; y: number };
    targetPosition?: { x: number; y: number };
    initialPosition?: { x: number; y: number };
    cardStyle?: CardStyle;
    index?: number;
    disabled?: boolean;
    animationType?: CardAnimationType | null;
    _isAnimating?: boolean;
    onClick?: () => void;
    className?: string;
    highlight?: boolean;
    zIndex?: number;
    dealDuration?: number;
    flipDuration?: number;
}

/**
 * AnimatedCard component renders a playing card with optional animations
 * Supports dealing, flipping, and collecting animations
 */
const AnimatedCard: React.FC<AnimatedCardProps> = ({
    id,
    suit = 'spades',
    rank = 'A',
    faceDown = false,
    dealt = false,
    style = {},
    position,
    targetPosition,
    initialPosition,
    cardStyle = 'modern',
    index = 0,
    disabled = false,
    animationType = null,
    _isAnimating = false,
    onClick,
    className = '',
    highlight = false,
    zIndex = 0,
    dealDuration = 300,
    flipDuration = 250,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    // Calculate card label for accessibility
    const suitName = {
        'hearts': 'Hearts',
        'diamonds': 'Diamonds',
        'clubs': 'Clubs',
        'spades': 'Spades'
    }[suit];

    const rankName = {
        'A': 'Ace',
        '2': '2',
        '3': '3',
        '4': '4',
        '5': '5',
        '6': '6',
        '7': '7',
        '8': '8',
        '9': '9',
        '10': '10',
        'J': 'Jack',
        'Q': 'Queen',
        'K': 'King'
    }[rank] || rank;

    const cardLabel = faceDown ? "Face down card" : `${rankName} of ${suitName}`;

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    // Get path for card image based on style and face
    const getCardImagePath = (): string => {
        if (faceDown) {
            // Map card style to an available back style
            const backStyleMap: Record<string, string> = {
                'modern': 'blue',
                'classic': 'red',
                'retro': 'abstract_scene',
                'minimal': 'minimal_blue'
            };

            // Use the mapped style or fallback to blue
            const backStyle = backStyleMap[cardStyle] || 'blue';
            return `/card/backs/${backStyle}.svg`;
        }

        // Map rank names for file paths
        const rankMap: Record<Rank, string> = {
            'A': 'ace',
            '2': '2',
            '3': '3',
            '4': '4',
            '5': '5',
            '6': '6',
            '7': '7',
            '8': '8',
            '9': '9',
            '10': '10',
            'J': 'jack',
            'Q': 'queen',
            'K': 'king'
        };

        return `/card/fronts/${suit}_${rankMap[rank]}.svg`;
    };

    const imagePath = getCardImagePath();

    // Card motion variants
    const dealVariants = {
        initial: {
            x: initialPosition?.x ?? -100,
            y: initialPosition?.y ?? -100,
            opacity: 0,
            scale: 0.8,
            rotateZ: -10,
            zIndex: 10 + index
        },
        dealt: {
            x: position?.x ?? 0,
            y: position?.y ?? 0,
            opacity: 1,
            scale: 1,
            rotateZ: 0,
            zIndex: 10 + index,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                duration: dealDuration / 1000,
                delay: index * 0.1
            }
        },
        target: {
            x: targetPosition?.x ?? position?.x ?? 0,
            y: targetPosition?.y ?? position?.y ?? 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 20,
                duration: dealDuration / 1000
            }
        },
        collect: {
            x: targetPosition?.x ?? 0,
            y: targetPosition?.y ?? 0,
            opacity: 0,
            scale: 0.8,
            rotateZ: Math.random() * 20 - 10,
            transition: {
                duration: dealDuration / 1000,
                delay: index * 0.05
            }
        },
        highlight: {
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.8)',
            scale: 1.05,
            transition: { duration: 0.3 }
        },
        rest: {
            boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
            scale: 1,
            transition: { duration: 0.3 }
        }
    };

    const flipVariants = {
        faceDown: {
            rotateY: 180,
            transition: { duration: flipDuration / 1000 }
        },
        faceUp: {
            rotateY: 0,
            transition: { duration: flipDuration / 1000 }
        }
    };

    // Determine which animation variant to use
    const getAnimationState = () => {
        if (!dealt) return 'initial';
        if (animationType === 'collect') return 'collect';
        if (targetPosition && position) return 'target';
        return 'dealt';
    };

    // Composite class names for the card
    const cardClasses = cn(
        'relative w-24 h-36',
        'rounded-lg shadow-md',
        'select-none',
        'transform-gpu',
        {
            'cursor-pointer': !!onClick && !disabled,
            'opacity-80': disabled,
            'ring-2 ring-white ring-opacity-70': highlight,
        },
        className
    );

    return (
        <motion.div
            ref={cardRef}
            className={cn(
                cardClasses,
                'perspective-1000'
            )}
            variants={dealVariants}
            initial={dealt ? 'initial' : false}
            animate={[
                getAnimationState(),
                highlight ? 'highlight' : 'rest'
            ]}
            style={{
                zIndex: zIndex + index,
                ...style
            }}
            whileHover={onClick && !disabled ? { scale: 1.05, transition: { duration: 0.2 } } : undefined}
            tabIndex={onClick ? 0 : -1}
            onClick={disabled ? undefined : onClick}
            onKeyDown={disabled ? undefined : handleKeyDown}
            aria-label={cardLabel}
            aria-disabled={disabled}
            data-card-id={id}
            data-testid={`card-${id}`}
        >
            {/* Card face/back flipping container */}
            <motion.div
                className="relative w-full h-full transform-style-3d"
                animate={faceDown ? 'faceDown' : 'faceUp'}
                variants={flipVariants}
            >
                {/* Card face */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-lg overflow-hidden bg-white",
                        "backface-hidden"
                    )}
                >
                    <Image
                        src={imagePath}
                        alt={cardLabel}
                        fill
                        className="object-contain"
                        priority={index < 4} // Prioritize loading the first few cards
                    />
                </div>

                {/* Card back */}
                <div
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-lg overflow-hidden bg-blue-800",
                        "backface-hidden",
                        "transform-gpu rotateY-180"
                    )}
                >
                    <Image
                        src={`/card/backs/${cardStyle === 'retro' ? 'abstract_scene' : 'blue'}.svg`}
                        alt="Card back"
                        fill
                        className="object-contain"
                        priority={index < 4}
                    />
                </div>
            </motion.div>

            {/* Card highlight effect for active cards */}
            {highlight && (
                <div className="absolute inset-0 bg-white rounded-lg pointer-events-none opacity-30 animate-pulse" />
            )}
        </motion.div>
    );
};

export default AnimatedCard;