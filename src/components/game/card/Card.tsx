'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import Image from 'next/image';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface CardProps {
    suit?: Suit;
    rank?: Rank;
    faceDown?: boolean;
    highlighted?: boolean;
    disabled?: boolean;
    flipped?: boolean;
    className?: string;
    dealt?: boolean;
    style?: React.CSSProperties;
    index?: number;
    onClick?: () => void;
    'aria-label'?: string;
    cardStyle?: string;
}

// Utility functions moved outside component
const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
        default: return '';
    }
};

const isRedSuit = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

// Animation variants moved outside component
const flipVariants = {
    faceDown: { rotateY: 180, transition: { duration: 0.5 } },
    faceUp: { rotateY: 0, transition: { duration: 0.5 } }
};

const dealVariants = {
    initial: {
        x: -100,
        y: -100,
        opacity: 0,
        scale: 0.8,
        rotateZ: -10
    },
    dealt: (index: number) => ({
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        rotateZ: 0,
        transition: {
            delay: index * 0.1,
            duration: 0.4,
            type: 'spring',
            stiffness: 200
        }
    })
};

// Get path for card SVG file
const getCardImagePath = (suit: Suit, rank: Rank, faceDown: boolean, cardStyle: string = 'modern'): string => {
    if (faceDown) {
        // Map card style to an available back style
        const backStyleMap: Record<string, string> = {
            'modern': 'blue',
            'classic': 'red',
            'retro': 'abstract_scene'
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

// Card corners component
const CardCorner = ({ rank, symbol, isRed, isRotated = false }: {
    rank: Rank;
    symbol: string;
    isRed: boolean;
    isRotated?: boolean;
}) => {
    const cornerClass = cn(
        'flex items-start justify-between',
        isRotated && 'transform rotate-180'
    );

    const textClass = cn(
        'font-bold text-lg',
        isRed ? 'text-red-600' : 'text-black dark:text-white'
    );

    const symbolClass = cn(
        'text-lg',
        isRed ? 'text-red-600' : 'text-black dark:text-white'
    );

    return (
        <div className={cornerClass}>
            <div className={textClass}>{rank}</div>
            <div className={symbolClass}>{symbol}</div>
        </div>
    );
};

// Card back component
const CardBack = () => (
    <div className={cn(
        'absolute inset-0 w-full h-full backface-hidden transform rotateY-180',
        'bg-gradient-to-br from-blue-600 to-blue-800 dark:from-gray-700 dark:to-gray-900',
        'border border-gray-200 dark:border-gray-700 rounded-lg'
    )}>
        <div className="absolute border-2 border-white rounded opacity-50 inset-3 dark:border-gray-500" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full dark:bg-gray-600 opacity-20" />
        </div>
        <div className="absolute flex items-center justify-center inset-4">
            <div className="w-8 h-8 bg-white rounded-full dark:bg-gray-500 opacity-30" />
        </div>
    </div>
);

const Card = ({
    suit = 'spades',
    rank = 'A',
    faceDown = false,
    highlighted = false,
    disabled = false,
    flipped = false,
    className = '',
    dealt = false,
    style,
    index = 0,
    onClick,
    'aria-label': ariaLabel,
    cardStyle = 'modern',
}: CardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isRed = isRedSuit(suit);
    const suitSymbol = getSuitSymbol(suit);

    // Generate aria-label if not provided
    const faceUpLabel = `${rank} of ${suit}`;
    const cardLabel = ariaLabel ?? (faceDown ? 'Face down card' : faceUpLabel);

    // Handle click and keyboard interactions for accessibility
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
        }
    };

    // Generate card container class names
    const cardClasses = cn(
        'relative card flex items-center justify-center rounded-lg shadow-md',
        'w-24 h-36 select-none',
        'bg-white dark:bg-gray-800 overflow-hidden',
        highlighted && 'ring-2 ring-offset-2 ring-primary',
        disabled && 'opacity-70',
        className
    );

    const imagePath = getCardImagePath(suit, rank, faceDown, cardStyle);

    return (
        <motion.div
            ref={cardRef}
            className={cardClasses}
            variants={dealVariants}
            initial={dealt ? 'initial' : false}
            animate={dealt ? { ...dealVariants.dealt(index) } : undefined}
            style={{
                perspective: '1000px',
                ...style
            }}
            whileHover={onClick && !disabled ? { scale: 1.05, transition: { duration: 0.2 } } : undefined}
            tabIndex={onClick ? 0 : -1}
            onClick={disabled ? undefined : onClick}
            onKeyDown={disabled ? undefined : handleKeyDown}
            aria-label={cardLabel}
            aria-disabled={disabled}
        >
            {/* Card face/back flipping container */}
            <motion.div
                className="relative w-full h-full"
                animate={faceDown ? 'faceDown' : 'faceUp'}
                variants={flipVariants}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden">
                    <Image
                        src={imagePath}
                        alt={cardLabel}
                        fill
                        style={{ objectFit: 'contain' }}
                        priority={index < 4} // Prioritize loading the first few cards
                    />
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Card;