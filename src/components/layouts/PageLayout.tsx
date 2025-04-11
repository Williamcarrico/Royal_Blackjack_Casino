'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils/utils';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
}

/**
 * PageLayout component provides a consistent layout structure for game pages
 */
const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    className,
}) => {
    return (
        <div className={cn(
            'flex flex-col min-h-screen',
            className
        )}>
            {children}
        </div>
    );
};

export default PageLayout;