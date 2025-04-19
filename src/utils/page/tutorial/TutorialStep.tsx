'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X, Info, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

export interface TutorialStepProps {
    title: string;
    description: string;
    stepNumber: number;
    totalSteps: number;
    image?: string;
    videoSrc?: string;
    isActive?: boolean;
    targetElementSelector?: string;
    highlightTarget?: boolean;
    className?: string;
    stepType?: 'info' | 'action' | 'warning' | 'success';
    position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
    allowSkip?: boolean;
    onNext?: () => void;
    onPrev?: () => void;
    onSkip?: () => void;
    onComplete?: () => void;
    onDismiss?: () => void;
    children?: React.ReactNode;
}

const TutorialStep = ({
    title,
    description,
    stepNumber,
    totalSteps,
    image,
    videoSrc,
    isActive = true,
    targetElementSelector,
    highlightTarget = true,
    className = '',
    stepType = 'info',
    position = 'bottom',
    allowSkip = true,
    onNext,
    onPrev,
    onSkip,
    onComplete,
    onDismiss,
    children,
}: TutorialStepProps) => {
    // Highlight the target element if specified
    React.useEffect(() => {
        if (isActive && targetElementSelector && highlightTarget) {
            const targetElement = document.querySelector(targetElementSelector);
            if (targetElement) {
                // Add highlight class to target element
                targetElement.classList.add('tutorial-highlight');

                // Cleanup
                return () => {
                    targetElement.classList.remove('tutorial-highlight');
                };
            }
        }
        return () => { }; // Empty cleanup function for when no element is found
    }, [targetElementSelector, highlightTarget, isActive]);

    // Early return if not active
    if (!isActive) return null;

    // Icon based on step type
    const getStepIcon = () => {
        switch (stepType) {
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'action':
                return <ArrowRight className="w-5 h-5 text-blue-500" />;
            case 'info':
            default:
                return <Info className="w-5 h-5 text-sky-500" />;
        }
    };

    // Background color based on step type
    const getBackgroundColor = () => {
        switch (stepType) {
            case 'warning':
                return 'bg-amber-500/10 border-amber-500/30';
            case 'success':
                return 'bg-green-500/10 border-green-500/30';
            case 'action':
                return 'bg-blue-500/10 border-blue-500/30';
            case 'info':
            default:
                return 'bg-sky-500/10 border-sky-500/30';
        }
    };

    // Position classes
    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full mb-4';
            case 'right':
                return 'left-full ml-4';
            case 'bottom':
                return 'top-full mt-4';
            case 'left':
                return 'right-full mr-4';
            case 'center':
            default:
                return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
        }
    };

    // Animation variants
    const variants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            scale: 0.95,
            transition: {
                duration: 0.2
            }
        }
    };

    // Determine if this is the final step
    const isFinalStep = stepNumber === totalSteps;

    // Handle button clicks
    const handleNext = () => {
        if (isFinalStep) {
            onComplete?.();
        } else {
            onNext?.();
        }
    };

    const handlePrev = () => {
        onPrev?.();
    };

    const handleSkip = () => {
        onSkip?.();
    };

    const handleDismiss = () => {
        onDismiss?.();
    };

    return (
        <AnimatePresence mode="wait">
            {isActive && (
                <div className={cn(
                    "fixed inset-0 z-50 flex items-center justify-center bg-black/50",
                    className
                )}>
                    <motion.div
                        className={cn(
                            "relative max-w-md rounded-lg border p-4 shadow-lg backdrop-blur-sm",
                            getBackgroundColor(),
                            position === 'center' ? 'w-full mx-4' : getPositionClasses()
                        )}
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Close button */}
                        {onDismiss && (
                            <button
                                onClick={handleDismiss}
                                className="absolute p-1 transition-colors rounded-full top-2 right-2 hover:bg-foreground/10"
                                aria-label="Close tutorial"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}

                        {/* Step indicator */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-foreground/10">
                                {stepNumber}/{totalSteps}
                            </div>
                            {getStepIcon()}
                            <h3 className="text-base font-semibold">{title}</h3>
                        </div>

                        {/* Media content (image or video) */}
                        {(image || videoSrc) && (
                            <div className="mb-3 overflow-hidden rounded-md">
                                {image && (
                                    <Image
                                        src={image}
                                        alt={`Tutorial step ${stepNumber}`}
                                        width={500}
                                        height={300}
                                        className="w-full h-auto"
                                        priority
                                    />
                                )}
                                {videoSrc && (
                                    <video
                                        src={videoSrc}
                                        autoPlay
                                        loop
                                        muted
                                        className="w-full h-auto"
                                    />
                                )}
                            </div>
                        )}

                        {/* Description */}
                        <p className="mb-4 text-sm text-foreground/80">
                            {description}
                        </p>

                        {/* Additional content */}
                        {children && (
                            <div className="mb-4">
                                {children}
                            </div>
                        )}

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between mt-2">
                            <div className="flex gap-2">
                                {stepNumber > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handlePrev}
                                        className="flex items-center gap-1"
                                        aria-label="Previous step"
                                    >
                                        <ArrowLeft className="w-3 h-3" />
                                        <span className="sr-only sm:not-sr-only">Previous</span>
                                    </Button>
                                )}

                                {allowSkip && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSkip}
                                        className="text-foreground/60"
                                        aria-label="Skip tutorial"
                                    >
                                        Skip
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleNext}
                                className="flex items-center gap-1"
                                aria-label={isFinalStep ? "Complete tutorial" : "Next step"}
                            >
                                <span>{isFinalStep ? 'Finish' : 'Next'}</span>
                                {!isFinalStep && <ArrowRight className="w-3 h-3" />}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TutorialStep;