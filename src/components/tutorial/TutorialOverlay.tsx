'use client';

/** @jsxImportSource react */
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

type Position = 'top' | 'right' | 'bottom' | 'left';

export interface TutorialHighlightTarget {
    selector: string;
    label?: string;
    description?: string;
    position?: Position;
    highlightColor?: string;
    pulseEffect?: boolean;
    order?: number;
    isOptional?: boolean;
}

export interface TutorialOverlayProps {
    isActive: boolean;
    targets: TutorialHighlightTarget[];
    overlayColor?: string;
    overlayOpacity?: number;
    showLabels?: boolean;
    showNumbers?: boolean;
    showAll?: boolean;
    sequential?: boolean;
    currentIndex?: number;
    zIndex?: number;
    onTargetClick?: (index: number, target: TutorialHighlightTarget) => void;
    onOverlayClick?: () => void;
    onComplete?: () => void;
    className?: string;
}

type HighlightElement = {
    target: TutorialHighlightTarget;
    element: Element;
    rect: DOMRect;
};

const TutorialOverlay = ({
    isActive,
    targets = [],
    overlayColor = 'rgb(0, 0, 0)',
    overlayOpacity = 0.5,
    showLabels = true,
    showNumbers = true,
    showAll = false,
    sequential = false,
    currentIndex = 0,
    zIndex = 50,
    onTargetClick,
    onOverlayClick,
    onComplete,
    className = '',
}: TutorialOverlayProps) => {
    const [highlightElements, setHighlightElements] = useState<Array<{ target: TutorialHighlightTarget, element: Element, rect: DOMRect }>>([]);
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
    const overlayRef = useRef<HTMLButtonElement>(null);
    const hasMeasuredRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(false);

    // Sort targets by order if available
    const sortedTargets = [...targets].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return 0;
    });

    // Create portal container
    useEffect(() => {
        if (typeof document === 'undefined') return;

        let container = document.getElementById('tutorial-overlay-portal');

        if (!container) {
            container = document.createElement('div');
            container.id = 'tutorial-overlay-portal';
            document.body.appendChild(container);
        }

        setPortalContainer(container);

        return () => {
            container?.parentElement?.removeChild(container);
        };
    }, []);

    // Find and measure target elements
    useEffect(() => {
        isMountedRef.current = true;

        if (!isActive) {
            setHighlightElements([]);
            return;
        }

        if (hasMeasuredRef.current) {
            return;
        }

        const foundElements = sortedTargets
            .map(target => {
                const element = document.querySelector(target.selector);
                if (!element) return null;

                const rect = element.getBoundingClientRect();
                return { target, element, rect };
            })
            .filter((item): item is HighlightElement => item !== null);

        if (isMountedRef.current) {
            hasMeasuredRef.current = true;
            setHighlightElements(foundElements);
        }

        const handleResize = () => {
            if (!isMountedRef.current) return;

            const updatedElements = foundElements.map(({ target, element }) => {
                const rect = element.getBoundingClientRect();
                return { target, element, rect };
            });

            setHighlightElements(updatedElements);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            isMountedRef.current = false;
            window.removeEventListener('resize', handleResize);
        };
    }, [isActive, sortedTargets]);

    // Reset the hasMeasured ref when dependencies change
    useEffect(() => {
        hasMeasuredRef.current = false;
    }, [isActive, targets]);

    // Filter elements to show based on sequential mode
    let visibleElements: HighlightElement[] = [];
    if (showAll) {
        visibleElements = highlightElements;
    } else if (sequential) {
        const currentHighlight = highlightElements[currentIndex];
        if (currentHighlight) {
            visibleElements = [currentHighlight];
        }
    } else {
        visibleElements = highlightElements;
    }

    // Handle when the tutorial completes (all targets shown)
    useEffect(() => {
        if (sequential && currentIndex >= highlightElements.length && onComplete) {
            onComplete();
        }
    }, [sequential, currentIndex, highlightElements.length, onComplete]);

    // Handle target click
    const handleTargetClick = (index: number, highlightTarget: { target: TutorialHighlightTarget, element: Element, rect: DOMRect }) => {
        if (onTargetClick) {
            onTargetClick(index, highlightTarget.target);
        }
    };

    // Handle overlay click
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current && onOverlayClick) {
            onOverlayClick();
        }
    };

    // Get position for tooltips
    const getTooltipPosition = (rect: DOMRect, position: Position = 'bottom') => {
        switch (position) {
            case 'top':
                return {
                    top: `${rect.top - 8}px`,
                    left: `${rect.left + rect.width / 2}px`,
                };
            case 'right':
                return {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.right + 8}px`,
                };
            case 'left':
                return {
                    top: `${rect.top + rect.height / 2}px`,
                    left: `${rect.left - 8}px`,
                };
            case 'bottom':
            default:
                return {
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left + rect.width / 2}px`,
                };
        }
    };

    // Get arrow direction for tooltips
    const getArrowDirection = (position: Position = 'bottom') => {
        switch (position) {
            case 'top':
                return 'bottom';
            case 'right':
                return 'left';
            case 'left':
                return 'right';
            case 'bottom':
            default:
                return 'top';
        }
    };

    // Create clip path to show elements through overlay
    const createClipPath = () => {
        if (!visibleElements.length) return 'none';

        return `path('${visibleElements
            .map(({ rect }) => {
                const padding = 4;
                return `M${rect.left - padding},${rect.top - padding} h${rect.width + padding * 2} v${rect.height + padding * 2} h-${rect.width + padding * 2}z`;
            })
            .join(' ')}')`;
    };

    // Helper function to get initial motion state
    const getInitialMotionState = (position?: Position) => {
        const pos = position ?? 'bottom';
        const initialOffset = 10;

        if (pos === 'top') return { opacity: 0, y: initialOffset };
        if (pos === 'bottom') return { opacity: 0, y: -initialOffset };
        if (pos === 'left') return { opacity: 0, x: initialOffset };
        if (pos === 'right') return { opacity: 0, x: -initialOffset };

        return { opacity: 0 };
    };

    // Don't render if not active or no portal container
    if (!isActive || !portalContainer) return null;

    return createPortal(
        <button
            ref={overlayRef}
            type="button"
            className={cn(
                "tutorial-overlay fixed inset-0 pointer-events-auto w-full h-full p-0 m-0 border-0",
                className
            )}
            aria-label="Tutorial overlay background"
            data-overlay-background={`rgba(${overlayColor.slice(4, -1)}, ${overlayOpacity})`}
            data-overlay-z-index={zIndex}
            data-overlay-clip-path={createClipPath()}
            onClick={handleOverlayClick}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onOverlayClick) onOverlayClick();
                }
            }}
        >
            <svg width="0" height="0">
                <defs>
                    <filter id="tutorial-highlight-filter">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="glow" />
                        <feComposite in="SourceGraphic" in2="glow" operator="over" />
                    </filter>
                </defs>
            </svg>

            {/* Highlight boxes */}
            <AnimatePresence>
                {visibleElements.map((highlight, index) => {
                    const { rect, target } = highlight;
                    const padding = 4;

                    return (
                        <React.Fragment key={`highlight-${target.selector}`}>
                            {/* Highlight box */}
                            <motion.div
                                className="absolute pointer-events-none tutorial-highlight-box"
                                data-highlight-left={`${rect.left - padding}px`}
                                data-highlight-top={`${rect.top - padding}px`}
                                data-highlight-width={`${rect.width + padding * 2}px`}
                                data-highlight-height={`${rect.height + padding * 2}px`}
                                data-highlight-color={target.highlightColor ?? '#3b82f6'}
                                data-overlay-background={overlayColor}
                                data-overlay-opacity={overlayOpacity}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* Pulse effect */}
                                {target.pulseEffect && (
                                    <motion.div
                                        className="tutorial-pulse-effect absolute inset-0 rounded-[4px]"
                                        data-highlight-color={target.highlightColor ?? '#3b82f6'}
                                        animate={{
                                            opacity: [1, 0.2, 1],
                                            scale: [1, 1.05, 1],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                        }}
                                    />
                                )}

                                {/* Step number */}
                                {showNumbers && (target.order !== undefined || sequential) && (
                                    <div
                                        className="absolute flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full shadow-md -top-3 -left-3 bg-primary text-primary-foreground"
                                    >
                                        {target.order !== undefined ? target.order + 1 : index + 1}
                                    </div>
                                )}

                                {/* Clickable overlay for the target */}
                                <button
                                    className="absolute inset-0 w-full h-full p-0 m-0 bg-transparent border-none cursor-pointer"
                                    aria-label={`Highlight for ${target.label ?? target.selector}`}
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleTargetClick(index, highlight);
                                    }}
                                >
                                    <span className="sr-only">
                                        {target.label ?? `Interact with ${target.selector}`}
                                    </span>
                                </button>
                            </motion.div>

                            {/* Label tooltip */}
                            {showLabels && (target.label || target.description) && (
                                <motion.div
                                    className={cn(
                                        "tutorial-tooltip absolute pointer-events-none",
                                        `tooltip-position-${target.position ?? 'bottom'}`
                                    )}
                                    style={{
                                        ...getTooltipPosition(rect, target.position),
                                    }}
                                    data-tooltip-z-index={zIndex + 1}
                                    initial={getInitialMotionState(target.position)}
                                    animate={{ opacity: 1, y: 0, x: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                >
                                    <div className="relative p-2 border rounded-md shadow-lg bg-background border-border">
                                        {/* Arrow */}
                                        <div
                                            className={cn(
                                                "absolute w-2 h-2 bg-background border-t border-l border-border rotate-45 transform",
                                                {
                                                    "-top-1.5": getArrowDirection(target.position) === 'top',
                                                    "-bottom-1.5 rotate-[225deg]": getArrowDirection(target.position) === 'bottom',
                                                    "-left-1.5 rotate-[315deg]": getArrowDirection(target.position) === 'left',
                                                    "-right-1.5 rotate-[135deg]": getArrowDirection(target.position) === 'right'
                                                }
                                            )}
                                        />

                                        {target.label && (
                                            <div className="mb-1 text-sm font-medium">{target.label}</div>
                                        )}

                                        {target.description && (
                                            <div className="text-xs text-muted-foreground max-w-[200px]">{target.description}</div>
                                        )}

                                        {target.isOptional && (
                                            <div className="mt-1 text-xs italic text-muted-foreground">(Optional step)</div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </React.Fragment>
                    );
                })}
            </AnimatePresence>
        </button>,
        portalContainer
    );
};

export default TutorialOverlay;