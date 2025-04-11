'use client';

import { useRef, forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import useTableLighting from '@/hooks/useTableLighting';
import BettingControls from '@/components/betting/BettingControls';

interface BlackjackTableProps {
    className?: string;
    variant?: 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip';
    playerBalance?: number;
    currentBet?: number;
    onPlaceBet?: (bet: number) => void;
    onClearBet?: () => void;
    onMaxBet?: () => void;
    onDoubleBet?: () => void;
    onDealCards?: () => void;
    isBettingPhase?: boolean;
    isActionPhase?: boolean;
    disableBetting?: boolean;
}

const BlackjackTable = forwardRef<HTMLDivElement, BlackjackTableProps>(({
    className,
    variant = 'green',
    playerBalance = 1500,
    currentBet = 0,
    onPlaceBet,
    onClearBet,
    onMaxBet,
    onDoubleBet,
    onDealCards,
    isBettingPhase = true,
    disableBetting = false,
}, ref) => {
    // Create local refs if no ref is provided
    const internalTableRef = useRef<HTMLDivElement>(null);
    const feltRef = useRef<HTMLDivElement>(null);

    // Use either the provided ref or internal ref
    const tableRef = ref || internalTableRef;

    // Set up lighting effect with the hook
    useTableLighting({
        tableRef: internalTableRef, // Always use internal ref for the hook
        feltRef,
        intensity: 0.15,
        enabled: true,
    });

    // Map variant to felt image and border color
    const variantMap = {
        green: {
            felt: '/pattern/table-felt-green-vip.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        red: {
            felt: '/pattern/table-felt-red.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        blue: {
            felt: '/pattern/table-felt-blue.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        black: {
            felt: '/pattern/table-felt-black.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        dark: {
            felt: '/pattern/table-felt-dark.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        light: {
            felt: '/pattern/table-felt-light.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
        vip: {
            felt: '/pattern/table-felt-vip.png',
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
        },
    };

    const { felt, borderColor, textColor } = variantMap[variant];

    return (
        <div
            ref={tableRef}
            className={cn(
                'relative w-full h-full max-w-[1200px] max-h-[700px]',
                'mx-auto rounded-[150px] overflow-hidden shadow-2xl',
                'transition-all duration-300 flex items-center justify-center',
                className
            )}
        >
            {/* Wooden table base */}
            <div className="absolute inset-0 z-0 bg-center bg-cover" style={{ backgroundImage: 'url(/texture/wooden-table.png)' }} />

            {/* Felt with pattern overlay */}
            <div
                ref={feltRef}
                className={cn(
                    'absolute inset-[20px] rounded-[130px] z-10 overflow-hidden',
                    'shadow-inner border-[10px]',
                    borderColor
                )}
            >
                {/* Base felt texture */}
                <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${felt})` }} />

                {/* Pattern overlay */}
                <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: 'url(/pattern/pattern.svg)' }} />

                {/* Table markings */}
                <div className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-90" style={{ backgroundImage: 'url(/table/blackjack-markings.svg)' }} />
            </div>

            {/* Royal logo */}
            <div className="absolute top-[20px] left-1/2 transform -translate-x-1/2 z-20 w-[120px] h-[120px]">
                <Image
                    src="/logos/royal-logo.png"
                    alt="Royal Casino"
                    width={120}
                    height={120}
                    className="object-contain"
                />
            </div>

            {/* Dealer area */}
            <div className="absolute top-[160px] left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
                <div className={cn('text-xl font-bold mb-2', textColor)}>Dealer</div>
                <div className="w-[280px] h-[150px] rounded-lg border-2 border-amber-400/30 flex items-center justify-center">
                    {/* Dealer's cards will be rendered here by parent component */}
                </div>
            </div>

            {/* Insurance line */}
            <motion.div
                className={cn(
                    'absolute top-[330px] left-1/2 w-4/5 transform -translate-x-1/2 z-20',
                    'h-[40px] flex items-center justify-center',
                    'border-2 border-amber-400/50 bg-black/20 rounded-full'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className={cn('text-lg font-bold', textColor)}>INSURANCE PAYS 2 TO 1</div>
            </motion.div>

            {/* Player areas - 5 positions with improved spacing */}
            <div className="absolute bottom-[180px] left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center gap-10">
                {[1, 2, 3, 4, 5].map((position) => (
                    <div key={`player-${position}`} className="flex flex-col items-center">
                        <div className="w-[120px] h-[160px] rounded-lg border-2 border-amber-400/40 flex items-center justify-center bg-black/10">
                            {/* Player's cards will be rendered here by parent component */}
                        </div>

                        {/* Betting circle */}
                        <motion.div
                            className={cn(
                                'mt-4 w-[80px] h-[80px] rounded-full',
                                'border-2 border-amber-400/70',
                                'flex items-center justify-center',
                                'bg-black/40',
                                position === 3 && 'ring-4 ring-yellow-400/30'
                            )}
                            whileHover={{ scale: 1.05 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 + position * 0.1 }}
                        >
                            {/* Chips will be rendered here */}
                            {position === 3 && currentBet > 0 && (
                                <div className="text-amber-400 font-bold">${currentBet}</div>
                            )}
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* Betting controls at the bottom - increased z-index and visual prominence */}
            <div className="absolute bottom-[40px] left-1/2 transform -translate-x-1/2 z-30 w-[95%]">
                {isBettingPhase && (
                    <BettingControls
                        balance={playerBalance}
                        currentBet={currentBet}
                        onPlaceBet={onPlaceBet}
                        onClearBet={onClearBet}
                        onMaxBet={onMaxBet}
                        onDoubleBet={onDoubleBet}
                        onDealCards={onDealCards}
                        disabled={disableBetting}
                        className="bg-black/50 border border-amber-800/40 p-4 rounded-xl"
                    />
                )}
            </div>

            {/* Decorative elements - Table railing */}
            <div className="absolute inset-0 rounded-[150px] z-5 pointer-events-none border-[16px] border-amber-900/60" />

            {/* Ambient light effect overlay */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                <div className="absolute inset-0 opacity-50 bg-gradient-radial from-transparent to-black/40" />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent opacity-40" />
            </div>
        </div>
    );
});

BlackjackTable.displayName = 'BlackjackTable';

export default BlackjackTable;