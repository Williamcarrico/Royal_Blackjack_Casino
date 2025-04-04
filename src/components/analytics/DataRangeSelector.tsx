'use client'

import { useState } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/layout/button'
import { DateRangeOption } from './types'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { format } from 'date-fns'

interface DateRangeSelectorProps {
    onRangeChangeAction: (range: { start: Date; end: Date }) => void;
    className?: string;
}

export const DateRangeSelector = ({ onRangeChangeAction, className = '' }: DateRangeSelectorProps) => {
    const [selectedRange, setSelectedRange] = useState<string>('last7days');
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
    const [isCustomRange, setIsCustomRange] = useState(false);

    const dateRangeOptions: DateRangeOption[] = [
        { label: 'Today', value: 'today', days: 0 },
        { label: 'Last 7 days', value: 'last7days', days: 7 },
        { label: 'Last 30 days', value: 'last30days', days: 30 },
        { label: 'Last 90 days', value: 'last90days', days: 90 },
        { label: 'All time', value: 'alltime', days: 1000 },
        { label: 'Custom range', value: 'custom', days: 0 },
    ];

    const handleRangeChange = (value: string) => {
        setSelectedRange(value);

        if (value === 'custom') {
            setIsCustomRange(true);
            return;
        }

        setIsCustomRange(false);

        const option = dateRangeOptions.find(opt => opt.value === value);
        if (!option) return;

        const end = new Date();
        const start = new Date();

        if (value === 'today') {
            start.setHours(0, 0, 0, 0);
        } else {
            start.setDate(start.getDate() - option.days);
        }

        onRangeChangeAction({ start, end });
    };

    const handleCustomRangeApply = () => {
        if (customStartDate && customEndDate) {
            onRangeChangeAction({
                start: customStartDate,
                end: customEndDate
            });
        }
    };

    const moveRange = (direction: 'prev' | 'next') => {
        const option = dateRangeOptions.find(opt => opt.value === selectedRange);
        if (!option || option.value === 'custom' || option.value === 'alltime') return;

        const days = option.days === 0 ? 1 : option.days;

        if (isCustomRange && customStartDate && customEndDate) {
            const dayDiff = Math.round((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24));

            const newStartDate = new Date(customStartDate);
            const newEndDate = new Date(customEndDate);

            if (direction === 'prev') {
                newStartDate.setDate(newStartDate.getDate() - dayDiff - 1);
                newEndDate.setDate(newEndDate.getDate() - dayDiff - 1);
            } else {
                newStartDate.setDate(newStartDate.getDate() + dayDiff + 1);
                newEndDate.setDate(newEndDate.getDate() + dayDiff + 1);
            }

            setCustomStartDate(newStartDate);
            setCustomEndDate(newEndDate);
            onRangeChangeAction({ start: newStartDate, end: newEndDate });
            return;
        }

        const end = new Date();
        const start = new Date();

        if (direction === 'prev') {
            end.setDate(end.getDate() - days);
            start.setDate(start.getDate() - days * 2);
        } else if (new Date().getTime() - end.getTime() < 1000 * 60 * 60 * 24) {
            // Already at latest date
            return;
        } else {
            start.setDate(start.getDate() + days);
            end.setDate(end.getDate() + days);
        }

        onRangeChangeAction({ start, end });
    };

    const formatDateRange = () => {
        if (isCustomRange && customStartDate && customEndDate) {
            return `${format(customStartDate, 'MMM d, yyyy')} - ${format(customEndDate, 'MMM d, yyyy')}`;
        }

        const option = dateRangeOptions.find(opt => opt.value === selectedRange);
        return option?.label ?? '';
    };
    return (
        <section className={`flex items-center space-x-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-gray-700 bg-gray-800/70 hover:bg-gray-700"
                onClick={() => moveRange('prev')}
            >
                <ArrowLeft className="w-4 h-4" />
            </Button>

            <div className="relative min-w-[180px]">
                {isCustomRange ? (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="justify-between w-full text-sm border-gray-700 bg-gray-800/70 hover:bg-gray-700"
                            >
                                <span className="truncate">{formatDateRange()}</span>
                                <CalendarDays className="w-4 h-4 ml-2" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
                            <div className="flex">
                                <div className="border-r border-gray-700">
                                    <CalendarComponent
                                        mode="single"
                                        selected={customStartDate}
                                        onSelect={setCustomStartDate}
                                        className="text-white bg-gray-800 rounded-none"
                                    />
                                </div>
                                <div>
                                    <CalendarComponent
                                        mode="single"
                                        selected={customEndDate}
                                        onSelect={setCustomEndDate}
                                        className="text-white bg-gray-800 rounded-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end p-3 border-t border-gray-700">
                                <Button
                                    size="sm"
                                    onClick={handleCustomRangeApply}
                                    disabled={!customStartDate || !customEndDate}
                                    className="text-white bg-amber-600 hover:bg-amber-700"
                                >
                                    Apply Range
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <Select value={selectedRange} onValueChange={handleRangeChange}>
                        <SelectTrigger className="h-8 border-gray-700 bg-gray-800/70 hover:bg-gray-700">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                            {dateRangeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-gray-200">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 border-gray-700 bg-gray-800/70 hover:bg-gray-700"
                onClick={() => moveRange('next')}
            >
                <ArrowRight className="w-4 h-4" />
            </Button>
        </section>
    );
};

export default DateRangeSelector;