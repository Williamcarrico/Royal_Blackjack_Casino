'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils/utils'
import { Input } from './input'

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
    setTimeAction: (time: string) => void
    value: string
}

export function TimePicker({
    className,
    setTimeAction,
    value,
    disabled,
    ...props
}: TimePickerProps) {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTimeAction(event.target.value)
    }

    return (
        <div className="relative">
            <Input
                type="time"
                value={value}
                onChange={handleChange}
                disabled={disabled}
                className={cn(
                    "pl-10 text-sm bg-black/50 border-amber-900/50 text-amber-100",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
                {...props}
            />
            <Clock className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-amber-400" />
        </div>
    )
}