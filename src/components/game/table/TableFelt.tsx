'use client';

import React from 'react';
import { cn } from '@/lib/utils/utils';

export interface TableFeltProps {
    children: React.ReactNode;
    className?: string;
    darkMode?: boolean;
    pattern?: 'default' | 'dots' | 'lines' | 'subtle' | 'none';
    borderRadius?: string;
    strokeWidth?: number;
}

const TableFelt = ({
    children,
    className = '',
    darkMode = true,
    pattern = 'default',
    borderRadius = '1.5rem',
    strokeWidth = 3,
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
            case 'none':
            default:
                return '';
        }
    };

    // Base fill color for the table felt
    const bgColor = darkMode ? '#0E472A' : '#12734A';

    // Determine the fill value based on pattern
    const getFillValue = () => {
        if (pattern === 'none') return bgColor;
        const patternId = pattern === 'default' ? 'diamonds' : pattern;
        return `url(#${patternId})`;
    };

    const borderRadiusClass = `rounded-[${borderRadius}]`;

    return (
        <div
            className={cn(
                'relative w-full aspect-video min-h-[50vh] overflow-hidden',
                'flex items-center justify-center',
                borderRadiusClass,
                className
            )}
        >
            {/* SVG Pattern Background */}
            <svg
                width="100%"
                height="100%"
                className={cn("absolute inset-0 z-0", borderRadiusClass)}
                preserveAspectRatio="xMidYMid slice"
            >
                <defs>
                    {pattern !== 'none' && (
                        <div dangerouslySetInnerHTML={{ __html: generatePattern() }} />
                    )}
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill={getFillValue()}
                />

                {/* Table border */}
                <rect
                    x="1%"
                    y="1%"
                    width="98%"
                    height="98%"
                    rx={borderRadius}
                    ry={borderRadius}
                    fill="none"
                    stroke={darkMode ? '#0D4127' : '#106B40'}
                    strokeWidth={strokeWidth * 2}
                />
            </svg>

            {/* Table grid lines */}
            <div className="absolute top-0 left-0 w-full h-full z-[1]">
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

            {/* Table spot markings */}
            <div className="absolute top-0 left-0 w-full h-full z-[2] pointer-events-none">
                {/* Logo or table marking in center */}
                <div className="absolute font-serif text-4xl font-bold transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 text-white/10">
                    ROYAL 21
                </div>
            </div>

            {/* Container for children */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
};

export default TableFelt;