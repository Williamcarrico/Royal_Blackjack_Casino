'use client';

import { useRef, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
    _onDoubleBet?: () => void;
    onDealCards?: () => void;
    isBettingPhase?: boolean;
    disableBetting?: boolean;
    _isPlayerInitialized?: boolean;
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
    _onDoubleBet,
    onDealCards,
    isBettingPhase = true,
    disableBetting = false,
    _isPlayerInitialized,
}, ref) => {
    // Create local refs for the table and felt elements
    const internalTableRef = useRef<HTMLDivElement>(null);
    const tableRef = ref || internalTableRef;
    const feltRef = useRef<HTMLDivElement>(null);

    // Define chip sizes and values for betting UI
    const chips = [
        { value: 5, color: 'bg-red-600', size: 'w-12 h-12', ringColor: 'ring-white' },
        { value: 25, color: 'bg-green-600', size: 'w-12 h-12', ringColor: 'ring-white' },
        { value: 100, color: 'bg-blue-700', size: 'w-12 h-12', ringColor: 'ring-white' },
        { value: 500, color: 'bg-black', size: 'w-12 h-12', ringColor: 'ring-amber-400' },
    ];

    // Create interactive lighting effect on mouse move
    useEffect(() => {
        const tableElement = internalTableRef.current;
        const feltElement = feltRef.current;

        if (!tableElement || !feltElement) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = tableElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate relative position (0-1)
            const relativeX = Math.min(Math.max(x / rect.width, 0), 1);
            const relativeY = Math.min(Math.max(y / rect.height, 0), 1);

            // Create lighting effect using CSS variables
            tableElement.style.setProperty('--light-x', `${relativeX * 100}%`);
            tableElement.style.setProperty('--light-y', `${relativeY * 100}%`);

            // Update felt shadow based on light position
            feltElement.style.boxShadow = `
                inset ${(relativeX - 0.5) * -10}px ${(relativeY - 0.5) * -10}px 20px rgba(0,0,0,0.3),
                inset ${(relativeX - 0.5) * 15}px ${(relativeY - 0.5) * 15}px 30px rgba(255,255,255,0.1)
            `;
        };

        tableElement.addEventListener('mousemove', handleMouseMove);

        return () => {
            tableElement.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    // Map variant to table appearance
    const variantStyles = {
        green: {
            feltColor: 'bg-emerald-800',
            feltBorderColor: 'border-emerald-900/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/70',
            shadowColor: 'shadow-emerald-900/40',
            patternOpacity: 'opacity-20',
            lightingIntensity: '0.15',
        },
        red: {
            feltColor: 'bg-red-900',
            feltBorderColor: 'border-red-950/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/70',
            shadowColor: 'shadow-red-950/40',
            patternOpacity: 'opacity-10',
            lightingIntensity: '0.2',
        },
        blue: {
            feltColor: 'bg-blue-900',
            feltBorderColor: 'border-blue-950/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/70',
            shadowColor: 'shadow-blue-950/40',
            patternOpacity: 'opacity-15',
            lightingIntensity: '0.15',
        },
        black: {
            feltColor: 'bg-zinc-900',
            feltBorderColor: 'border-zinc-950/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/70',
            shadowColor: 'shadow-black/60',
            patternOpacity: 'opacity-10',
            lightingIntensity: '0.12',
        },
        dark: {
            feltColor: 'bg-slate-900',
            feltBorderColor: 'border-slate-950/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/70',
            shadowColor: 'shadow-slate-950/60',
            patternOpacity: 'opacity-10',
            lightingIntensity: '0.1',
        },
        light: {
            feltColor: 'bg-emerald-700',
            feltBorderColor: 'border-emerald-800/80',
            textColor: 'text-amber-200',
            accentColor: 'border-amber-300/70',
            shadowColor: 'shadow-emerald-900/30',
            patternOpacity: 'opacity-25',
            lightingIntensity: '0.2',
        },
        vip: {
            feltColor: 'bg-indigo-900',
            feltBorderColor: 'border-indigo-950/80',
            textColor: 'text-amber-300',
            accentColor: 'border-amber-400/80 border-opacity-80',
            shadowColor: 'shadow-indigo-950/50',
            patternOpacity: 'opacity-15',
            lightingIntensity: '0.18',
        },
    };

    const {
        feltColor,
        feltBorderColor,
        textColor,
        accentColor,
        shadowColor,
        patternOpacity
    } = variantStyles[variant];

    // UI appearance modifiers based on game state
    const tableIsActive = !disableBetting || isBettingPhase;
    const canDeal = currentBet > 0 && isBettingPhase;

    // Handle chip click to place bet
    const handleChipClick = (value: number) => {
        if (disableBetting || !onPlaceBet) return;
        onPlaceBet(value);
    };

    // CSS variable styles for the table
    const tableStyles = {
        '--light-x': '50%',
        '--light-y': '50%',
    } as React.CSSProperties;

    // Dynamic lighting effect style
    const lightingEffectClass = "absolute inset-0 transition-opacity duration-300 pointer-events-none opacity-10";
    const dynamicLightingStyle = {
        background: 'radial-gradient(circle at var(--light-x) var(--light-y), rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%)'
    };

    // Chip stack positioning style generator
    const getChipStackStyle = (index: number) => ({
        bottom: `${index * 3}px`,
        left: '2px',
        zIndex: 10 - index,
    });

    return (
        <div
            ref={tableRef}
            className={cn(
                'relative w-full h-full max-w-[1280px] max-h-[720px]',
                'mx-auto rounded-[250px_250px_0_0] overflow-hidden',
                'shadow-2xl transition-all duration-300',
                tableIsActive ? 'opacity-100' : 'opacity-90',
                'border-t-8 border-l-8 border-r-8 border-amber-900/80',
                className
            )}
            style={tableStyles}
        >
            {/* Table base with wood texture */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-amber-800 to-amber-950 opacity-90">
                <div className="absolute inset-0 bg-[url('/texture/wooden-table.png')] bg-repeat opacity-30"></div>
            </div>

            {/* Silver beveled border */}
            <div className="absolute inset-0 rounded-t-[250px] border-t-[12px] border-l-[12px] border-r-[12px] border-amber-400/30 z-10 overflow-hidden">
                <div className="absolute inset-0 opacity-50 bg-gradient-to-b from-amber-200/10 to-transparent"></div>
            </div>

            {/* Felt surface */}
            <div
                ref={feltRef}
                className={cn(
                    'absolute inset-[16px] rounded-t-[235px] z-20 overflow-hidden',
                    'shadow-inner transition-all duration-300',
                    'border-t-[8px] border-l-[8px] border-r-[8px]',
                    feltBorderColor
                )}
            >
                {/* Base felt texture */}
                <div className={cn(
                    "absolute inset-0 transition-all duration-500",
                    feltColor
                )}>
                    {/* Dynamic lighting effect */}
                    <div
                        className={lightingEffectClass}
                        style={dynamicLightingStyle}
                    ></div>
                </div>

                {/* Pattern overlay */}
                <div className={cn(
                    "absolute inset-0 bg-repeat bg-[url('/pattern/pattern.svg')]",
                    patternOpacity
                )}></div>

                {/* Table markings using a more precise SVG layout */}
                <div className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-90">
                    <svg className="w-full h-full" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
                        {/* Main title - ROYAL BLACKJACK */}
                        <text x="500" y="80" textAnchor="middle" fill="rgba(255,215,0,0.9)" fontSize="36" fontWeight="bold" fontFamily="serif">ROYAL BLACKJACK</text>

                        {/* Blackjack pays 3:2 text */}
                        <text x="500" y="130" textAnchor="middle" fill="rgba(255,215,0,0.9)" fontSize="22" fontWeight="bold" fontFamily="serif">BLACKJACK PAYS 3 TO 2</text>

                        {/* Insurance line and text - professionally positioned */}
                        <line x1="200" y1="180" x2="800" y2="180" stroke="rgba(255,215,0,0.5)" strokeWidth="2" />
                        <text x="500" y="205" textAnchor="middle" fill="rgba(255,215,0,0.7)" fontSize="18" fontFamily="serif">INSURANCE PAYS 2 TO 1</text>

                        {/* Dealer must stand on all 17's - placed below */}
                        <text x="500" y="230" textAnchor="middle" fill="rgba(255,215,0,0.7)" fontSize="18" fontFamily="serif">DEALER MUST STAND ON ALL 17&apos;s</text>
                    </svg>
                </div>
            </div>

            {/* Table rail - authentic table detail */}
            <div className="absolute inset-x-0 bottom-0 z-50 h-4 shadow-inner bg-gradient-to-b from-amber-900 to-amber-950"></div>

            {/* Table limits sign - properly positioned */}
            <div className="absolute z-10 -right-4/12 -top-3/12">
                <div className={cn(
                    'py-2 px-4 rounded-lg',
                    'border-2', accentColor,
                    'bg-black/30 backdrop-blur-sm',
                    shadowColor,
                    'shadow-md'
                )}>
                    <div className={cn('text-sm font-serif font-bold text-center', textColor)}>
                        TABLE LIMITS
                    </div>
                    <div className={cn('text-sm font-serif text-center', textColor)}>
                        ${minBet} - ${maxBet}
                    </div>
                </div>
            </div>

            {/* Dealer area - accurately positioned for authentic layout */}
            <div className="absolute z-30 flex flex-col items-center transform -translate-x-1/2 top-30 left-1/2">
                <div className={cn('text-xl font-serif font-semibold mb-2', textColor)}>
                    DEALER
                </div>
                <div className={cn(
                    'w-[320px] h-[170px] rounded-xl',
                    'border-2', accentColor,
                    'flex items-center justify-center',
                    'bg-black/10',
                    'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
                )}>
                    {/* Cards will be rendered here by parent component */}
                </div>
            </div>

            {/* Card discard tray - authentic table detail */}
            <div className="absolute z-30 w-[70px] h-[40px] top-32 right-12 rounded-md bg-black/30 border-2 border-amber-800/40 shadow-md"></div>

            {/* Chip rack - positioned at the right side like a real blackjack table */}
            <div className="absolute z-30 w-[180px] h-[50px] top-32 left-12 rounded-md bg-amber-950/80 border-2 border-amber-800/50 shadow-md"></div>

            {/* Player positions - centered and evenly spaced */}
            <div className="absolute z-30 flex justify-center transform -translate-x-1/2 gap-28 bottom-32 left-1/2">
                {[0, 1, 2].map((position) => (
                    <div key={position} className="flex flex-col items-center">
                        {/* Player hand area */}
                        <div className={cn(
                            'w-[150px] h-[160px] rounded-xl mb-6',
                            'border-2', accentColor,
                            'flex items-center justify-center',
                            'bg-black/10',
                            'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
                            position === 1 && 'ring-2 ring-amber-400/30'
                        )}>
                            {/* Player cards will be rendered here */}
                        </div>

                        {/* Betting circle - central position highlighted */}
                        <motion.div
                            className={cn(
                                'w-20 h-20 rounded-full',
                                'border-2', accentColor,
                                'flex items-center justify-center',
                                'bg-black/20',
                                'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
                                position === 1 && 'ring-4 ring-amber-400/30'
                            )}
                            whileHover={!disableBetting ? { scale: 1.05 } : {}}
                        >
                            {position === 1 && currentBet > 0 && (
                                <div className="flex flex-col items-center">
                                    <div className={cn('font-bold text-2xl', textColor)}>
                                        ${currentBet}
                                    </div>
                                    {/* Chip stack visualization */}
                                    <div className="relative w-16 h-8 mt-1">
                                        {[...Array(Math.min(5, Math.ceil(currentBet / 100)))].map((_, i) => (
                                            <div
                                                key={`chip-stack-${currentBet}-${i}`}
                                                className={cn(
                                                    "absolute w-14 h-14 rounded-full",
                                                    "border-2 border-amber-400/50",
                                                    "shadow-md",
                                                    (() => {
                                                        if (i % 3 === 0) return "bg-red-600";
                                                        if (i % 3 === 1) return "bg-blue-700";
                                                        return "bg-green-600";
                                                    })(),
                                                )}
                                                style={getChipStackStyle(i)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* Side bet circles - positioned to frame the central betting position */}
            <div className="absolute z-30 flex justify-between w-[280px] transform -translate-x-1/2 bottom-16 left-1/2">
                <motion.div
                    className={cn(
                        'w-14 h-14 rounded-full',
                        'border-2', accentColor,
                        'flex items-center justify-center',
                        'bg-black/20',
                        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
                        'text-xs font-medium text-center leading-tight',
                        textColor
                    )}
                    whileHover={!disableBetting ? { scale: 1.05 } : {}}
                >
                    21+3
                </motion.div>

                <motion.div
                    className={cn(
                        'w-14 h-14 rounded-full',
                        'border-2', accentColor,
                        'flex items-center justify-center',
                        'bg-black/20',
                        'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
                        'text-xs font-medium text-center leading-tight',
                        textColor
                    )}
                    whileHover={!disableBetting ? { scale: 1.05 } : {}}
                >
                    PERFECT<br />PAIRS
                </motion.div>
            </div>

            {/* Chip tray and betting controls - positioned at proper position on table edge */}
            <AnimatePresence>
                {isBettingPhase && !disableBetting && (
                    <motion.div
                        className="absolute z-40 flex flex-col items-center transform -translate-x-1/2 bottom-6 left-1/2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Betting chips row */}
                        <div className="flex justify-center gap-4 mb-4">
                            {chips.map((chip) => (
                                <motion.div
                                    key={chip.value}
                                    className={cn(
                                        chip.size, chip.color,
                                        'rounded-full flex items-center justify-center cursor-pointer',
                                        'border-2 border-gray-200/40 shadow-lg',
                                        'transition-transform select-none',
                                        'shadow-[0_4px_6px_rgba(0,0,0,0.3)]',
                                        playerBalance < chip.value && 'opacity-40 cursor-not-allowed'
                                    )}
                                    whileHover={playerBalance >= chip.value ? { scale: 1.1, y: -5 } : {}}
                                    whileTap={playerBalance >= chip.value ? { scale: 0.95 } : {}}
                                    onClick={() => playerBalance >= chip.value && handleChipClick(chip.value)}
                                >
                                    <span className="font-bold text-white">${chip.value}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-4">
                            <Button
                                onClick={onClearBet}
                                disabled={currentBet === 0}
                                className="text-white bg-red-700 shadow-md hover:bg-red-600"
                                size="sm"
                            >
                                Clear
                            </Button>

                            <Button
                                onClick={onMaxBet}
                                disabled={playerBalance <= 0 || playerBalance < minBet}
                                className="text-white shadow-md bg-amber-700 hover:bg-amber-600"
                                size="sm"
                            >
                                Max Bet
                            </Button>

                            <Button
                                onClick={onDealCards}
                                disabled={!canDeal}
                                className={cn(
                                    "bg-green-700 hover:bg-green-600 text-white px-8 shadow-md",
                                    canDeal && "animate-pulse"
                                )}
                                size="sm"
                            >
                                Deal
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Ambient lighting effects */}
            <div className="absolute inset-0 z-40 pointer-events-none">
                {/* Vignette effect */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/40 opacity-60"></div>

                {/* Table edge highlight */}
                <div className="absolute inset-0 rounded-t-[250px] border-t-[1px] border-l-[1px] border-r-[1px] border-amber-300/20"></div>

                {/* Additional subtle felt texture */}
                <div className="absolute inset-[20px] rounded-t-[230px] bg-[url('/texture/felt-texture.png')] bg-repeat opacity-5"></div>

                {/* Subtle lighting on table edge */}
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-amber-100/20 via-transparent to-transparent"></div>
            </div>
        </div>
    );
});

BlackjackTable.displayName = 'BlackjackTable';

export default BlackjackTable;