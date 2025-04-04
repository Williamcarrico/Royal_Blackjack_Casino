/** @jsxImportSource react */
/** @jsxRuntime classic */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/utils';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Percent, DollarSign, Clock, Award } from 'lucide-react';

export interface StatisticData {
    label: string;
    value: number | string;
    previousValue?: number | string;
    changeType?: 'increase' | 'decrease' | 'neutral';
    changePercent?: number;
    icon?: 'profit' | 'loss' | 'percent' | 'dollar' | 'time' | 'award' | React.ReactElement;
    format?: 'number' | 'currency' | 'percent' | 'time' | 'text';
    precision?: number;
}

export interface StatisticsCardProps {
    title: string;
    description?: string;
    statistics: StatisticData[];
    className?: string;
    variant?: 'default' | 'outline' | 'gradient' | 'dim';
    size?: 'sm' | 'md' | 'lg';
    animated?: boolean;
    footer?: React.ReactNode;
}

const StatisticsCard = ({
    title,
    description,
    statistics,
    className = '',
    variant = 'default',
    size = 'md',
    animated = true,
    footer,
}: StatisticsCardProps) => {
    // Function to format values based on type
    const formatValue = (value: number | string, format?: 'number' | 'currency' | 'percent' | 'time' | 'text', precision = 0) => {
        if (typeof value === 'string') {
            return value;
        }

        switch (format) {
            case 'currency':
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                }).format(value);
            case 'percent':
                return new Intl.NumberFormat('en-US', {
                    style: 'percent',
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                }).format(value / 100);
            case 'time': {
                // Format minutes:seconds
                const minutes = Math.floor(value / 60);
                const seconds = Math.floor(value % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            default:
                return new Intl.NumberFormat('en-US', {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                }).format(value);
        }
    };

    // Function to get icon component based on type
    const getIcon = (iconType: 'profit' | 'loss' | 'percent' | 'dollar' | 'time' | 'award' | React.ReactElement) => {
        if (React.isValidElement(iconType)) {
            return iconType;
        }

        switch (iconType) {
            case 'profit':
                return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'loss':
                return <TrendingDown className="w-4 h-4 text-red-500" />;
            case 'percent':
                return <Percent className="w-4 h-4 text-blue-500" />;
            case 'dollar':
                return <DollarSign className="w-4 h-4 text-amber-500" />;
            case 'time':
                return <Clock className="w-4 h-4 text-purple-500" />;
            case 'award':
                return <Award className="w-4 h-4 text-indigo-500" />;
            default:
                return null;
        }
    };

    // Classes based on variant
    const getCardClasses = () => {
        switch (variant) {
            case 'outline':
                return 'bg-background border-2';
            case 'gradient':
                return 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20';
            case 'dim':
                return 'bg-background/80 backdrop-blur-sm';
            default:
                return 'bg-card';
        }
    };

    // Classes based on size
    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'p-2';
            case 'lg':
                return 'p-6';
            default:
                return 'p-4';
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 }
        }
    };

    const StatComponent = animated ? motion.div : 'div';

    return animated ? (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <Card
                className={cn(
                    getCardClasses(),
                    className
                )}
            >
                <CardHeader className={getSizeClasses()}>
                    <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>

                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {statistics.map((stat) => (
                        <StatComponent
                            key={`${stat.label}-${String(stat.value)}`}
                            className="flex flex-col space-y-1"
                            variants={animated ? itemVariants : undefined}
                        >
                            <div className="flex items-center gap-2">
                                {stat.icon && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                                        {typeof stat.icon === 'string' ? getIcon(stat.icon) : stat.icon}
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>

                            <div className="flex items-end justify-between">
                                <p className="text-xl font-semibold">
                                    {formatValue(stat.value, stat.format, stat.precision)}
                                </p>

                                {stat.changeType && stat.changePercent !== undefined && (() => {
                                    const colorClass = (() => {
                                        if (stat.changeType === 'increase') {
                                            return "text-green-500";
                                        } else if (stat.changeType === 'decrease') {
                                            return "text-red-500";
                                        } else {
                                            return "text-gray-500";
                                        }
                                    })();

                                    return (
                                        <div className={cn(
                                            "text-xs font-medium flex items-center gap-1",
                                            colorClass
                                        )}>
                                            {(() => {
                                                if (stat.changeType === 'increase') {
                                                    return <TrendingUp className="w-3 h-3" />;
                                                } else if (stat.changeType === 'decrease') {
                                                    return <TrendingDown className="w-3 h-3" />;
                                                }
                                                return null;
                                            })()}
                                            <span>{stat.changePercent}%</span>
                                        </div>
                                    );
                                })()}
                            </div>

                            {stat.previousValue !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                    Previous: {formatValue(stat.previousValue, stat.format, stat.precision)}
                                </p>
                            )}
                        </StatComponent>
                    ))}
                </CardContent>

                {footer && (
                    <CardFooter className={getSizeClasses()}>
                        {footer}
                    </CardFooter>
                )}
            </Card>
        </motion.div>
    ) : (
        <Card
            className={cn(
                getCardClasses(),
                className
            )}
        >
            <CardHeader className={getSizeClasses()}>
                <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {statistics.map((stat) => (
                    <div
                        key={`${stat.label}-${String(stat.value)}`}
                        className="flex flex-col space-y-1"
                    >
                        <div className="flex items-center gap-2">
                            {stat.icon && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                                    {typeof stat.icon === 'string' ? getIcon(stat.icon) : stat.icon}
                                </div>
                            )}
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>

                        <div className="flex items-end justify-between">
                            <p className="text-xl font-semibold">
                                {formatValue(stat.value, stat.format, stat.precision)}
                            </p>

                            {stat.changeType && stat.changePercent !== undefined && (() => {
                                const colorClass = (() => {
                                    if (stat.changeType === 'increase') {
                                        return "text-green-500";
                                    } else if (stat.changeType === 'decrease') {
                                        return "text-red-500";
                                    } else {
                                        return "text-gray-500";
                                    }
                                })();

                                return (
                                    <div className={cn(
                                        "text-xs font-medium flex items-center gap-1",
                                        colorClass
                                    )}>
                                        {(() => {
                                            if (stat.changeType === 'increase') {
                                                return <TrendingUp className="w-3 h-3" />;
                                            } else if (stat.changeType === 'decrease') {
                                                return <TrendingDown className="w-3 h-3" />;
                                            }
                                            return null;
                                        })()}
                                        <span>{stat.changePercent}%</span>
                                    </div>
                                );
                            })()}
                        </div>

                        {stat.previousValue !== undefined && (
                            <p className="text-xs text-muted-foreground">
                                Previous: {formatValue(stat.previousValue, stat.format, stat.precision)}
                            </p>
                        )}
                    </div>
                ))}
            </CardContent>

            {footer && (
                <CardFooter className={getSizeClasses()}>
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
};

export default StatisticsCard;