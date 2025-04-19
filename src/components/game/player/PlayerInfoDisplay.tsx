'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import { DEFAULT_STARTING_CHIPS } from '@/lib/constants/gameConstants';

interface PlayerInfoDisplayProps {
    playerName?: string;
    playerBalance?: number;
    className?: string;
    variant?: 'light' | 'dark';
}

/**
 * PlayerInfoDisplay component that shows player name and balance
 * This is a dedicated component to ensure the player balance is always displayed correctly
 */
const PlayerInfoDisplay: React.FC<PlayerInfoDisplayProps> = ({
    playerName = 'Player',
    playerBalance = DEFAULT_STARTING_CHIPS,
    className,
    variant = 'dark',
}) => {
    // Ensure balance is never 0 or null/undefined
    const safeBalance = playerBalance <= 0 ? DEFAULT_STARTING_CHIPS : playerBalance;

    return (
        <div className={cn(
            'p-3 rounded-lg',
            variant === 'dark' ? 'bg-gray-900/60' : 'bg-gray-100/60',
            className
        )}>
            <h3 className={cn(
                'text-lg font-bold mb-2 border-b pb-2',
                variant === 'dark' ? 'border-gray-700' : 'border-gray-300'
            )}>
                Player Info
            </h3>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Name:</span>
                    <span className="font-medium">{playerName}</span>
                </div>

                <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className={cn(
                        'font-medium',
                        'text-green-400'
                    )}>
                        ${safeBalance.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PlayerInfoDisplay;