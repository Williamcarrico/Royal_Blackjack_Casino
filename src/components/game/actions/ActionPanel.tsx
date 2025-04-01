'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ActionButton, { GameAction } from './ActionButton';

export interface GameActionState {
    hit: boolean;
    stand: boolean;
    double: boolean;
    split: boolean;
    surrender: boolean;
    insurance: boolean;
    evenMoney: boolean;
    deal: boolean;
    rebet: boolean;
}

export interface ActionPanelProps {
    availableActions: Partial<GameActionState>;
    recommendedAction?: GameAction;
    onAction?: (action: GameAction) => void;
    className?: string;
    compact?: boolean;
    vertical?: boolean;
    showShortcuts?: boolean;
    disabled?: boolean;
    animateEntry?: boolean;
    player?: string;
    handId?: string;
}

const ActionPanel = ({
    availableActions,
    recommendedAction,
    onAction,
    className = '',
    compact = false,
    vertical = false,
    showShortcuts = true,
    disabled = false,
    animateEntry = true,
    player,
    handId,
}: ActionPanelProps) => {
    // Handle keyboard shortcuts
    useEffect(() => {
        if (disabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            if (
                document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA'
            ) {
                return;
            }

            const key = e.key.toLowerCase();

            // Handle special case for space and enter
            if (key === ' ' || key === 'enter') {
                if (availableActions.deal) {
                    e.preventDefault();
                    onAction?.('deal');
                } else if (recommendedAction) {
                    e.preventDefault();
                    onAction?.(recommendedAction);
                }
                return;
            }

            // Map keys to actions
            const actionMap: Record<string, [keyof GameActionState, GameAction]> = {
                'h': ['hit', 'hit'],
                's': ['stand', 'stand'],
                'd': ['double', 'double'],
                'p': ['split', 'split'],
                'r': ['surrender', 'surrender'],
                'i': ['insurance', 'insurance'],
                'e': ['evenMoney', 'even-money']
            };

            const actionConfig = actionMap[key];
            if (actionConfig) {
                const [actionCheck, actionToExecute] = actionConfig;
                if (availableActions[actionCheck]) {
                    onAction?.(actionToExecute);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [availableActions, recommendedAction, onAction, disabled]);

    // Animation variants for action panel
    const panelVariants = {
        hidden: {
            opacity: 0,
            y: 20,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                staggerChildren: 0.05,
                when: 'beforeChildren'
            }
        },
        exit: {
            opacity: 0,
            y: 20,
            transition: {
                duration: 0.2,
            }
        }
    };

    // Animation variants for each button
    const buttonVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        exit: { opacity: 0, y: 10 }
    };

    // Map to keep button order consistent
    const actionOrder: GameAction[] = [
        'hit',
        'stand',
        'double',
        'split',
        'surrender',
        'insurance',
        'even-money',
        'deal',
        'rebet'
    ];

    // Shortcut key mappings
    const actionShortcuts: Record<GameAction, string> = {
        hit: 'H',
        stand: 'S',
        double: 'D',
        split: 'P',
        surrender: 'R',
        insurance: 'I',
        'even-money': 'E',
        deal: '⏎',
        rebet: 'B',
        continue: '⏎',
        custom: ''
    };

    // Get action variant based on action type
    const getActionVariant = (action: GameAction) => {
        switch (action) {
            case 'stand': return 'primary';
            case 'hit': return 'secondary';
            case 'double': return 'success';
            case 'split': return 'warning';
            case 'surrender': return 'danger';
            case 'deal': return 'success';
            default: return 'default';
        }
    };

    // Active actions list based on availableActions
    const activeActions = actionOrder.filter(action => {
        const key = action === 'even-money' ? 'evenMoney' : action;
        return availableActions[key as keyof GameActionState];
    });

    // Render a single action button
    const renderActionButton = (action: GameAction) => {
        return (
            <motion.div
                key={action}
                variants={buttonVariants}
                className={compact ? 'scale-90' : ''}
            >
                <ActionButton
                    action={action}
                    disabled={disabled}
                    recommended={recommendedAction === action}
                    size={compact ? 'sm' : 'md'}
                    variant={getActionVariant(action)}
                    onClick={() => onAction?.(action)}
                    shortcut={showShortcuts ? actionShortcuts[action] : undefined}
                />
            </motion.div>
        );
    };

    // No actions available
    if (activeActions.length === 0) {
        return null;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`action-panel-${player}-${handId}`}
                className={cn(
                    'flex justify-center gap-2 p-2 rounded-lg bg-black/30 backdrop-blur-sm',
                    vertical ? 'flex-col' : 'flex-row',
                    className
                )}
                initial={animateEntry ? 'hidden' : false}
                animate="visible"
                exit="exit"
                variants={panelVariants}
                aria-label="Game action controls"
            >
                {activeActions.map(renderActionButton)}
            </motion.div>
        </AnimatePresence>
    );
};

export default ActionPanel;