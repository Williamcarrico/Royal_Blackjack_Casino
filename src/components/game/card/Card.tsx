'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';

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

    // Generate card face class names
    const cardFaceClasses = cn(
        'absolute inset-0 w-full h-full p-2 flex flex-col justify-between backface-hidden',
        'border border-gray-200 dark:border-gray-700 rounded-lg',
        flipped && 'transform rotate-180'
    );

    // Generate card center class names
    const cardCenterClasses = cn(
        'flex-grow flex items-center justify-center',
        'text-3xl font-bold',
        isRed ? 'text-red-600' : 'text-black dark:text-white'
    );

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
                {/* Card face */}
                <div className={cardFaceClasses}>
                    <CardCorner rank={rank} symbol={suitSymbol} isRed={isRed} />
                    <div className={cardCenterClasses}>{suitSymbol}</div>
                    <CardCorner rank={rank} symbol={suitSymbol} isRed={isRed} isRotated />
                </div>

                {/* Card back */}
                <CardBack />
            </motion.div>
        </motion.div>
    );
};

export default Card;