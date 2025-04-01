'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: number;
    icon?: ReactNode;
    description?: string;
    className?: string;
    colorScheme?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple';
    formatter?: (value: string | number) => string;
    isCurrency?: boolean;
    isPercentage?: boolean;
}

export const MetricCard = ({
    title,
    value,
    trend,
    icon,
    description,
    className = '',
    colorScheme = 'default',
    formatter,
    isCurrency = false,
    isPercentage = false
}: MetricCardProps) => {

    // Color schemes based on type
    const getColorScheme = () => {
        switch (colorScheme) {
            case 'success': return 'from-emerald-500/20 to-emerald-700/10 border-emerald-800/50 text-emerald-400';
            case 'danger': return 'from-red-500/20 to-red-700/10 border-red-800/50 text-red-400';
            case 'warning': return 'from-amber-500/20 to-amber-700/10 border-amber-800/50 text-amber-400';
            case 'info': return 'from-blue-500/20 to-blue-700/10 border-blue-800/50 text-blue-400';
            case 'purple': return 'from-violet-500/20 to-violet-700/10 border-violet-800/50 text-violet-400';
            default: return 'from-gray-700/50 to-gray-800/50 border-gray-700 text-gray-200';
        }
    };

    // Format the displayed value
    const displayValue = () => {
        if (formatter) return formatter(value);
        if (isCurrency) return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
        if (isPercentage) return `${value}%`;
        return value;
    };

    // Get trend icon and color
    const getTrendIndicator = () => {
        if (!trend || trend === 0) return <Minus className="w-4 h-4 text-gray-400" />;

        if (trend > 0) {
            return <TrendingUp className="w-4 h-4 text-emerald-400" />;
        } else {
            return <TrendingDown className="w-4 h-4 text-red-400" />;
        }
    };

    // Get trend text color
    const getTrendColorClass = () => {
        if (!trend || trend === 0) return 'text-gray-400';
        if (trend > 0) return 'text-emerald-400';
        return 'text-red-400';
    };

    // Animation variants
    const cardVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="initial"
            animate="animate"
            className={className}
        >
            <Card className={`bg-gradient-to-br border ${getColorScheme()} overflow-hidden relative`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/0 to-slate-800/80 z-0"></div>
                <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium text-gray-200">{title}</CardTitle>
                        {icon && <div className="p-1.5 rounded-full bg-gray-800/50">{icon}</div>}
                    </div>
                </CardHeader>
                <CardContent className="relative z-10">
                    <div className="flex items-baseline space-x-1">
                        <div className="text-2xl font-bold tracking-tight">{displayValue()}</div>
                        {trend !== undefined && (
                            <div className="flex items-center text-xs">
                                {getTrendIndicator()}
                                <span className={getTrendColorClass()}>
                                    {Math.abs(trend)}%
                                </span>
                            </div>
                        )}
                    </div>
                    {description && <p className="mt-1 text-xs text-gray-400">{description}</p>}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default MetricCard;