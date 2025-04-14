'use client';

import { useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import useTableLighting from '@/hooks/useTableLighting';
import BettingControls from '@/components/betting/BettingControls';

interface BlackjackTableProps {
    className?: string;
    variant?: 'green' | 'red' | 'blue' | 'black' | 'dark' | 'light' | 'vip';
    playerBalance?: number;
    currentBet?: number;
    minBet?: number;
    maxBet?: number;
    onPlaceBet?: (bet: number) => void;
    onClearBet?: () => void;
    onMaxBet?: () => void;
    onDoubleBet?: () => void;
    onDealCards?: () => void;
    isBettingPhase?: boolean;
    disableBetting?: boolean;
    isPlayerInitialized?: boolean;
}

const BlackjackTable = forwardRef<HTMLDivElement, BlackjackTableProps>(({
    className,
    variant = 'green',
    playerBalance = 1500,
    currentBet = 0,
    minBet = 5,
    maxBet = 500,
    onPlaceBet,
    onClearBet,
    onMaxBet,
    onDoubleBet,
    onDealCards,
    isBettingPhase = true,
    disableBetting = false,
    isPlayerInitialized = false,
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
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-green',
        },
        red: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-red',
        },
        blue: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-blue',
        },
        black: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-black',
        },
        dark: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-dark',
        },
        light: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-light',
        },
        vip: {
            borderColor: 'border-amber-800/80',
            textColor: 'text-amber-300',
            feltBg: 'bg-felt-vip',
        },
    };

    const { borderColor, textColor, feltBg } = variantMap[variant];

    return (
        <div
            ref={tableRef}
            className={cn(
                'relative w-full h-full max-w-[1200px] max-h-[700px]',
                'mx-auto overflow-hidden shadow-2xl',
                'transition-all duration-300 flex items-center justify-center',
                // Half-circle shape with flat bottom edge
                'rounded-t-[300px] rounded-b-none',
                className
            )}
        >
            {/* Wooden table base */}
            <div className="absolute inset-0 z-0 bg-center bg-cover bg-wooden-table" />

            {/* Silver beveled border */}
            <div className="absolute inset-0 z-5 rounded-t-[300px] pointer-events-none border-t-[16px] border-l-[16px] border-r-[16px] border-silver-bevel overflow-hidden">
                <div className="absolute inset-0 bg-silver-bevel-gradient opacity-80"></div>
            </div>

            {/* Wooden border trim */}
            <div className="absolute inset-[4px] z-5 rounded-t-[290px] pointer-events-none border-t-[12px] border-l-[12px] border-r-[12px] border-amber-500-900/90" />

            {/* Felt with pattern overlay */}
            <div
                ref={feltRef}
                className={cn(
                    'absolute inset-[20px] rounded-t-[280px] z-10 overflow-hidden',
                    'shadow-inner border-t-[10px] border-l-[10px] border-r-[10px]',
                    borderColor
                )}
            >
                {/* Base felt texture */}
                <div
                    className={cn(
                        "absolute inset-0 bg-center bg-cover",
                        feltBg
                    )}
                />

                {/* Pattern overlay */}
                <div className="absolute inset-0 bg-repeat bg-table-pattern opacity-10" />

                {/* Table markings */}
                <div className="absolute inset-0 bg-center bg-no-repeat bg-contain bg-blackjack-markings opacity-90" />
            </div>

            {/* Royal Blackjack Logo */}
            <div className="absolute top-[50px] left-1/2 transform -translate-x-1/2 z-20">
                <div className={cn('text-3xl font-serif text-yellow-500 font-bold mb-2 text-center tracking-wide', textColor)}>
                    ROYAL BLACKJACK
                </div>
                <div className={cn('text-xl text-yellow-500 font-serif mb-6 text-center', textColor)}>
                    BLACKJACK PAYS 3 TO 2
                </div>
            </div>

            {/* Betting limits sign */}
            <div className="absolute top-[50px] right-[80px] z-30">
                <div className={cn(
                    'py-2 px-4 border-2 border-amber-400/70 rounded-lg',
                    'bg-green-900 backdrop - blur - sm shadow - md'
                )}>
                    <div className={cn('text-lg font-serif font-bold text-center', textColor)}>
                        TABLE LIMITS
                    </div>
                    <div className={cn('text-base font-serif text-center', textColor)}>
                        MIN BET: ${minBet}
                    </div>
                    <div className={cn('text-base font-serif text-center', textColor)}>
                        MAX BET: ${maxBet}
                    </div>
                </div>
            </div>

            {/* Card rack / shoe */}
            <div className="absolute top-[140px] left-[80px] z-30">
                <div className={cn(
                    'w-[120px] h-[90px] rounded-lg',
                    'bg-gradient-to-b from-amber-800 to-amber-950',
                    'border-2 border-amber-400/40',
                    'shadow-md shadow-black/50',
                    'flex items-center justify-center'
                )}>
                    <div className={cn(
                        'w-[100px] h-[70px] rounded-md',
                        'bg-black/40 border border-amber-400/20',
                        'relative overflow-hidden'
                    )}>
                        {/* Card stack illusion */}
                        <div className="absolute rounded-sm inset-1 bg-white/90 rotate-1"></div>
                        <div className="absolute rounded-sm inset-1 bg-white/90 -rotate-1"></div>
                        <div className="absolute rounded-sm inset-1 bg-white/90"></div>
                    </div>
                </div>
            </div>

            {/* Chip holder / tray */}
            <div className="absolute top-[140px] right-[80px] z-30">
                <div className={cn(
                    'w-[180px] h-[90px] rounded-lg',
                    'bg-gradient-to-b from-amber-800 to-amber-950',
                    'border-2 border-amber-400/40',
                    'shadow-md shadow-black/50',
                    'flex items-center justify-center gap-1'
                )}>
                    {/* Chip slots */}
                    <div className="w-[30px] h-[70px] rounded-full bg-black/40 border border-amber-400/20"></div>
                    <div className="w-[30px] h-[70px] rounded-full bg-black/40 border border-amber-400/20"></div>
                    <div className="w-[30px] h-[70px] rounded-full bg-black/40 border border-amber-400/20"></div>
                    <div className="w-[30px] h-[70px] rounded-full bg-black/40 border border-amber-400/20"></div>
                    <div className="w-[30px] h-[70px] rounded-full bg-black/40 border border-amber-400/20"></div>
                </div>
            </div>

            {/* Dealer area with improved styling */}
            <div className="absolute top-[160px] left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
                <div className={cn('text-xl font-serif font-bold mb-2', textColor)}>Dealer</div>
                <div className="w-[280px] h-[150px] rounded-lg border-2 border-amber-400/30 flex items-center justify-center bg-black/10">
                    {/* Dealer's cards will be rendered here by parent component */}
                </div>
                <div className={cn('text-lg font-serif font-bold mt-3', textColor)}>
                    Dealer must draw to 16 and stand on all 17&apos;s
                </div>
            </div>

            {/* Insurance line with improved styling */}
            <motion.div
                className={cn(
                    'absolute top-[330px] left-1/2 w-4/5 transform -translate-x-1/2 z-20',
                    'h-[50px] flex items-center justify-center',
                    'border-2 border-amber-400/50 bg-black/20 rounded-lg'
                )}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className={cn('text-lg font-serif font-bold', textColor)}>INSURANCE PAYS 2 TO 1</div>
            </motion.div>

            {/* Player areas - 5 positions with improved spacing and styling */}
            <div className="absolute bottom-[180px] left-1/2 transform -translate-x-1/2 z-20 w-full flex justify-center gap-10">
                {[1, 2, 3, 4, 5].map((position) => (
                    <div key={`player-${position}`} className="flex flex-col items-center">
                        {/* Player card outline */}
                        <div className="w-[120px] h-[160px] rounded-lg border-2 border-amber-400/40 flex items-center justify-center bg-black/10">
                            {/* Player's cards will be rendered here by parent component */}
                        </div>

                        <div className="relative flex flex-col items-center">
                            {/* Side bet circle - 21+3 */}
                            {position === 3 && (
                                <motion.div
                                    className={cn(
                                        'absolute -left-16 top-5 w-[50px] h-[50px] rounded-full',
                                        'border-2 border-amber-400/70',
                                        'flex items-center justify-center text-xs',
                                        'bg-black/40',
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className={cn('font-serif text-center leading-tight', textColor)}>
                                        21+3
                                    </div>
                                </motion.div>
                            )}

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
                                    <div className="font-bold text-amber-400">${currentBet}</div>
                                )}
                            </motion.div>

                            {/* Perfect pairs side bet */}
                            {position === 3 && (
                                <motion.div
                                    className={cn(
                                        'absolute -right-16 top-5 w-[50px] h-[50px] rounded-full',
                                        'border-2 border-amber-400/70',
                                        'flex items-center justify-center text-xs',
                                        'bg-black/40',
                                    )}
                                    whileHover={{ scale: 1.05 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <div className={cn('font-serif text-center leading-tight', textColor)}>
                                        PERFECT PAIRS
                                    </div>
                                </motion.div>
                            )}
                        </div>
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
                        disabled={!isPlayerInitialized || disableBetting}
                        autoConfirm={true}
                        confirmEnabled={false}
                        className="p-4 border bg-black/50 border-amber-800/40 rounded-xl"
                    />
                )}
            </div>

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