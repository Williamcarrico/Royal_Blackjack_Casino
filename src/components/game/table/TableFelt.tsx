'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';
import Image from 'next/image';

export interface TableFeltProps {
    children: React.ReactNode;
    className?: string;
    darkMode?: boolean;
    pattern?: 'default' | 'dots' | 'lines' | 'subtle' | 'none' | 'luxury' | 'art-deco' | 'carpet';
    color?: 'green' | 'blue' | 'red' | 'black' | 'purple' | 'light' | 'dark' | 'vip' | 'green-vip';
    borderRadiusClass?: string;
    strokeWidth?: number;
    customPattern?: string;
    showLogo?: boolean;
    borderWidth?: number;
    variant?: 'default' | 'blackjack';
}

const TableFelt = ({
    children,
    className = '',
    darkMode = true,
    pattern = 'default',
    color = 'green',
    borderRadiusClass = 'rounded-3xl',
    strokeWidth = 3,
    customPattern = '',
    showLogo = true,
    borderWidth = 24,
    variant = 'default',
}: TableFeltProps) => {
    // Generate SVG pattern for the felt
    const generatePattern = () => {
        switch (pattern) {
            case 'dots':
                return `
          <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1" fill="rgba(255, 255, 255, 0.1)" />
          </pattern>
        `;
            case 'lines':
                return `
          <pattern id="lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="20" stroke="rgba(255, 255, 255, 0.1)" stroke-width="${strokeWidth}" />
            <line x1="20" y1="0" x2="0" y2="20" stroke="rgba(255, 255, 255, 0.1)" stroke-width="${strokeWidth}" />
          </pattern>
        `;
            case 'subtle':
                return `
          <pattern id="subtle" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 0,30 30,0 60,30 30,60 z" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="${strokeWidth}" />
          </pattern>
        `;
            case 'default':
                return `
          <pattern id="diamonds" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="40" height="40" fill="${darkMode ? '#104B2E' : '#1A7B46'}" />
            <circle cx="20" cy="20" r="2" fill="${darkMode ? '#125D37' : '#1D8F55'}" />
            <path d="M 0,20 20,0 40,20 20,40 z" fill="none" stroke="${darkMode ? '#115B35' : '#1E8A50'}" stroke-width="${strokeWidth / 2}" />
          </pattern>
        `;
            case 'luxury':
            case 'art-deco':
            case 'carpet':
                // These patterns will use external SVG files
                return '';
            case 'none':
            default:
                return '';
        }
    };

    // Check if we should use an image-based pattern
    const useImagePattern = color !== 'green' || ['luxury', 'art-deco', 'carpet'].includes(pattern);

    // Get the image pattern path if needed
    const getPatternImage = () => {
        if (['luxury', 'art-deco', 'carpet'].includes(pattern)) {
            const patternMap = {
                'luxury': '/pattern/luxury-casino-pattern.svg',
                'art-deco': '/pattern/art-deco.svg',
                'carpet': '/pattern/casino-carpet.svg'
            };
            return patternMap[pattern as keyof typeof patternMap];
        }

        if (color !== 'green') {
            // For color variations we use the pre-designed PNG files
            return `/pattern/table-felt-${color}.${color === 'purple' ? 'svg' : 'png'}`;
        }

        return '';
    };

    // Base fill color for the table felt
    const getBgColor = () => {
        if (color === 'green') {
            return darkMode ? '#0E472A' : '#12734A';
        }

        const colorMap = {
            'blue': '#0C4B7D',
            'red': '#7D1A1A',
            'black': '#222222',
            'purple': '#4A1A7D',
            'light': '#12734A',
            'dark': '#0E472A',
            'vip': '#2C1A7D',
            'green-vip': '#0E5C2A'
        };

        return colorMap[color] || '#0E472A';
    };

    // Determine the fill value based on pattern
    const getFillValue = () => {
        if (customPattern) return `url(${customPattern})`;
        if (pattern === 'none') return getBgColor();
        if (['luxury', 'art-deco', 'carpet'].includes(pattern)) return `url(#pattern-${pattern})`;

        const patternId = pattern === 'default' ? 'diamonds' : pattern;
        return `url(#${patternId})`;
    };

    // Calculate the inner radius based on border radius
    const getInnerBorderRadius = () => {
        if (borderRadiusClass === 'rounded-none') return 'rounded-none';
        if (borderRadiusClass === 'rounded-3xl') return 'rounded-2xl';
        if (borderRadiusClass === 'rounded-full') return 'rounded-full';
        return 'rounded-xl';
    };

    // Generate SVG pattern markup
    const patternMarkup = pattern !== 'none' &&
        !['luxury', 'art-deco', 'carpet'].includes(pattern) ?
        generatePattern() : '';

    // Render the felt based on pattern type
    const renderFelt = () => {
        if (useImagePattern) {
            return (
                // Image-based pattern
                <Image
                    src={getPatternImage()}
                    alt="Table felt"
                    fill
                    className="object-cover"
                    priority
                />
            );
        }

        if (pattern !== 'none') {
            return (
                // SVG pattern
                <svg
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                    preserveAspectRatio="xMidYMid slice"
                    dangerouslySetInnerHTML={{
                        __html: `
                            <defs>
                                ${patternMarkup}
                            </defs>
                            <rect
                                width="100%"
                                height="100%"
                                fill="${getFillValue()}"
                            />
                        `
                    }}
                />
            );
        }

        return null;
    };

    // Render blackjack table markings
    const renderBlackjackMarkings = () => {
        if (variant !== 'blackjack') return null;

        return (
            <div
                className="absolute inset-0 w-full h-full pointer-events-none z-[15]"
            >
                {/* Semi-transparent overlay to enhance marking visibility if needed */}
                <div className="absolute inset-0 bg-black/5"></div>

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 800 600"
                    className="absolute inset-0 w-full h-full mix-blend-soft-light"
                >
                    {/* Dealer card placement outline */}
                    <rect x="360" y="10" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />

                    {/* Royal Blackjack text */}
                    <text x="400" y="180" fill="#FFDF00" fontFamily="serif" fontSize="30" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">ROYAL BLACKJACK</text>

                    {/* BLACKJACK PAYS 3 TO 2 */}
                    <text x="400" y="230" fill="#FFDF00" fontFamily="serif" fontSize="24" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">BLACKJACK PAYS 3 TO 2</text>

                    {/* Dealer rules text */}
                    <text x="400" y="320" fill="#FFDF00" fontFamily="serif" fontSize="22" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">Dealer must draw to 16 and stand on all 17's</text>

                    {/* Left text: PAYS 2 TO 1 */}
                    <text x="200" y="345" fill="#FFDF00" fontFamily="serif" fontSize="22" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">PAYS 2 TO 1</text>

                    {/* INSURANCE text */}
                    <text x="400" y="345" fill="#FFDF00" fontFamily="serif" fontSize="22" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">INSURANCE</text>

                    {/* Right text: PAYS 2 TO 1 */}
                    <text x="600" y="345" fill="#FFDF00" fontFamily="serif" fontSize="22" fontWeight="bold" textAnchor="middle" filter="drop-shadow(0px 0px 2px #000)">PAYS 2 TO 1</text>

                    {/* Decorative banner shape */}
                    <path d="M100,295 L700,295 L720,325 L680,355 L120,355 L80,325 Z" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />

                    {/* Card placement outlines */}
                    <rect x="160" y="390" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />
                    <rect x="260" y="390" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />
                    <rect x="360" y="390" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />
                    <rect x="460" y="390" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />
                    <rect x="560" y="390" width="70" height="100" rx="5" ry="5" fill="none" stroke="#FFDF00" strokeWidth="2.5" />

                    {/* Betting circles */}
                    <circle cx="195" cy="540" r="30" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />
                    <circle cx="295" cy="540" r="30" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />
                    <circle cx="395" cy="540" r="30" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />
                    <circle cx="495" cy="540" r="30" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />
                    <circle cx="595" cy="540" r="30" fill="rgba(0,0,0,0.1)" stroke="#FFDF00" strokeWidth="2.5" />
                </svg>
            </div>
        );
    };

    // Use CSS custom properties for dynamic styling
    const feltClass = React.useMemo(() => {
        const classes = [
            "absolute z-10 overflow-hidden",
            getInnerBorderRadius()
        ];

        // Add background color if needed
        // Background is applied via inline styles instead of Tailwind classes
        // to avoid CSS parsing errors with dynamic values

        return classes;
    }, [getInnerBorderRadius, useImagePattern, pattern]);

    return (
        <div
            className={cn(
                'relative w-full aspect-video min-h-[50vh] overflow-hidden',
                'flex items-center justify-center',
                borderRadiusClass,
                className
            )}
        >
            {/* Wooden Table Border */}
            <div className={cn(
                "absolute inset-0 z-0 overflow-hidden",
                borderRadiusClass
            )}>
                <Image
                    src="/texture/wooden-table.png"
                    alt="Wooden table border"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Table Felt (Inner Area) */}
            <div
                className={cn(
                    ...feltClass,
                    "table-felt",
                    (!useImagePattern && pattern === 'none') && "felt-bg-color"
                )}
                style={!useImagePattern && pattern === 'none' ? { "--felt-bg-color": getBgColor() } as React.CSSProperties : {}}
                data-border-width={borderWidth}
            >
                <div className="table-felt-inner">
                    {renderFelt()}

                    {/* Table grid lines */}
                    {variant === 'default' && (
                        <div className="absolute top-0 left-0 w-full h-full">
                            <svg width="100%" height="100%" className="absolute inset-0">
                                {/* Center line */}
                                <line
                                    x1="50%"
                                    y1="0"
                                    x2="50%"
                                    y2="100%"
                                    stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth="1"
                                    strokeDasharray="5,5"
                                />

                                {/* Horizontal divider */}
                                <line
                                    x1="0"
                                    y1="50%"
                                    x2="100%"
                                    y2="50%"
                                    stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}
                                    strokeWidth="1"
                                    strokeDasharray="5,5"
                                />
                            </svg>
                        </div>
                    )}

                    {/* Blackjack table markings */}
                    {renderBlackjackMarkings()}

                    {/* Table spot markings */}
                    {showLogo && variant === 'default' && (
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                            {/* Logo or table marking in center */}
                            <div className="absolute font-serif text-4xl font-bold transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 text-white/10">
                                ROYAL 21
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Container for children */}
            <div className="relative z-20 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default TableFelt;