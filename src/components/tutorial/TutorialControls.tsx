'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/utils';
import {
    ChevronLeft,
    ChevronRight,
    SkipForward,
    Pause,
    Play,
    XCircle,
    RefreshCw,
    HelpCircle,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export interface TutorialControlsProps {
    isActive: boolean;
    currentStep: number;
    totalSteps: number;
    isPaused?: boolean;
    showStepIndicators?: boolean;
    showNextPrev?: boolean;
    showSkip?: boolean;
    showPlayPause?: boolean;
    showReset?: boolean;
    showList?: boolean;
    showHelp?: boolean;
    showClose?: boolean;
    compact?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center' | 'top-center';
    variant?: 'default' | 'outline' | 'glass' | 'minimal';
    className?: string;
    onNext?: () => void;
    onPrev?: () => void;
    onSkip?: () => void;
    onPause?: () => void;
    onPlay?: () => void;
    onReset?: () => void;
    onClose?: () => void;
    onHelp?: () => void;
    onListShow?: () => void;
    onStepClick?: (step: number) => void;
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.05
        }
    },
    exit: { opacity: 0, y: 20 }
};

const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 15
        }
    },
    hover: {
        scale: 1.1,
        transition: {
            duration: 0.2
        }
    }
};

// Helper functions to get position and variant classes
const getPositionClasses = (position: TutorialControlsProps['position']) => {
    switch (position) {
        case 'top-left': return 'top-4 left-4';
        case 'top-right': return 'top-4 right-4';
        case 'bottom-left': return 'bottom-4 left-4';
        case 'bottom-right': return 'bottom-4 right-4';
        case 'top-center': return 'top-4 left-1/2 transform -translate-x-1/2';
        case 'bottom-center':
        default: return 'bottom-4 left-1/2 transform -translate-x-1/2';
    }
};

const getVariantClasses = (variant: TutorialControlsProps['variant']) => {
    switch (variant) {
        case 'outline': return 'bg-transparent border border-white/20 text-white shadow-lg';
        case 'minimal': return 'bg-transparent';
        case 'glass':
        default: return 'bg-black/30 backdrop-blur-sm shadow-lg';
    }
};

// Component for a control button
const ControlButton = ({
    show,
    icon: Icon,
    label,
    onClick,
    compact,
    showText = false,
    textPosition = 'right'
}: {
    show: boolean;
    icon: React.ElementType;
    label: string;
    onClick?: () => void;
    compact?: boolean;
    showText?: boolean;
    textPosition?: 'left' | 'right';
}) => {
    if (!show) return null;

    return (
        <motion.div variants={buttonVariants} whileHover="hover">
            <Button
                variant="ghost"
                size={compact && !showText ? 'icon' : 'default'}
                className={cn("text-white hover:bg-white/20", compact && !showText ? 'h-8 w-8' : '')}
                onClick={onClick}
                aria-label={label}
            >
                {showText && textPosition === 'left' && <span className="mr-1">{label}</span>}
                <Icon className={cn(compact && !showText ? 'h-4 w-4' : 'h-5 w-5')} />
                {showText && textPosition === 'right' && <span className="ml-1">{label}</span>}
            </Button>
        </motion.div>
    );
};

// Component for step indicators
const StepIndicators = ({
    show,
    currentStep,
    totalSteps,
    onStepClick
}: {
    show: boolean;
    currentStep: number;
    totalSteps: number;
    onStepClick?: (step: number) => void;
}) => {
    if (!show) return null;

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }, (_, index) => (
                <motion.button
                    key={`step-${index}`}
                    className={cn(
                        "rounded-full",
                        currentStep === index
                            ? "bg-primary w-3 h-3"
                            : "bg-white/30 hover:bg-white/50 w-2 h-2",
                        onStepClick ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => onStepClick?.(index)}
                    variants={buttonVariants}
                    whileHover={onStepClick ? "hover" : undefined}
                    aria-label={`Go to step ${index + 1}`}
                />
            ))}
        </div>
    );
};

const TutorialControls = ({
    isActive,
    currentStep,
    totalSteps,
    isPaused = false,
    showStepIndicators = true,
    showNextPrev = true,
    showSkip = true,
    showPlayPause = false,
    showReset = false,
    showList = false,
    showHelp = false,
    showClose = true,
    compact = false,
    position = 'bottom-center',
    variant = 'glass',
    className = '',
    onNext,
    onPrev,
    onSkip,
    onPause,
    onPlay,
    onReset,
    onClose,
    onHelp,
    onListShow,
    onStepClick,
}: TutorialControlsProps) => {
    if (!isActive) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={cn(
                    "fixed z-50 p-2 rounded-lg flex items-center gap-2",
                    getPositionClasses(position),
                    getVariantClasses(variant),
                    className
                )}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                {/* Navigation Controls */}
                <ControlButton
                    show={showNextPrev && currentStep > 0}
                    icon={ChevronLeft}
                    label="Previous"
                    onClick={onPrev}
                    compact={compact}
                    showText={!compact}
                    textPosition="right"
                />

                <StepIndicators
                    show={showStepIndicators}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    onStepClick={onStepClick}
                />

                <ControlButton
                    show={showNextPrev && currentStep < totalSteps - 1}
                    icon={ChevronRight}
                    label="Next"
                    onClick={onNext}
                    compact={compact}
                    showText={!compact}
                    textPosition="left"
                />

                {/* Playback Controls */}
                <ControlButton
                    show={showPlayPause}
                    icon={isPaused ? Play : Pause}
                    label={isPaused ? "Resume tutorial" : "Pause tutorial"}
                    onClick={isPaused ? onPlay : onPause}
                    compact={compact}
                />

                <ControlButton
                    show={showSkip}
                    icon={SkipForward}
                    label="Skip"
                    onClick={onSkip}
                    compact={compact}
                    showText={!compact}
                    textPosition="left"
                />

                {/* Utility Controls */}
                <ControlButton
                    show={showReset}
                    icon={RefreshCw}
                    label="Restart tutorial"
                    onClick={onReset}
                    compact={compact}
                />

                <ControlButton
                    show={showList}
                    icon={List}
                    label="Show tutorial steps"
                    onClick={onListShow}
                    compact={compact}
                />

                <ControlButton
                    show={showHelp}
                    icon={HelpCircle}
                    label="Tutorial help"
                    onClick={onHelp}
                    compact={compact}
                />

                <ControlButton
                    show={showClose}
                    icon={XCircle}
                    label="Close tutorial"
                    onClick={onClose}
                    compact={compact}
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default TutorialControls;