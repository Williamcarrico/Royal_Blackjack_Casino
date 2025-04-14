'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Bell,
    CheckCheck,
    Trash2,
    Archive,
    Search,
    SlidersHorizontal,
    ChevronRight,
    MoreVertical,
    X,
    Settings
} from 'lucide-react'
import {
    GiCoins,
    GiDiamonds,
    GiBallGlow,
    GiInfo,
    GiPerson,
    GiCrown,
    GiMoneyStack
} from 'react-icons/gi'
import { cn } from '@/lib/utils/utils'
import { useNotifications } from '@/hooks/services/useNotifications'
import type { EnrichedNotification, NotificationType } from '@/types/notifications'
import { Button } from '@/components/ui/layout/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { NotificationPreferences } from '@/components/ui/NotificationPreferences'
import '@/styles/notifications.css'

// Notification item component
const NotificationItem: React.FC<{
    notification: EnrichedNotification
    onMarkAsRead: (id: string) => void
    onDelete: (id: string) => void
    onArchive: (id: string) => void
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    isSelectionMode: boolean
}> = ({
    notification,
    onMarkAsRead,
    onDelete,
    onArchive,
    selectedIds,
    onToggleSelect,
    isSelectionMode
}) => {
        // Animation variants
        const revealAnimation = {
            hidden: { opacity: 0, x: -5 },
            visible: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -5 }
        };

        const isSelected = selectedIds.has(notification.id);

        const handleClick = () => {
            if (isSelectionMode) {
                onToggleSelect(notification.id);
                return;
            }

            if (notification.status === 'unread') {
                onMarkAsRead(notification.id);
            }

            // If notification has an action URL and is not disabled, navigate
            if (notification.actionUrl) {
                // Programmatic navigation could happen here if needed
                window.location.href = notification.actionUrl;
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick();
            }
        };

        return (
            <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={revealAnimation}
                transition={{ duration: 0.2 }}
                className="relative group"
            >
                <button
                    className={cn(
                        'w-full text-left p-4 hover:bg-gradient-to-r hover:from-amber-900/20 hover:to-transparent focus:bg-amber-900/15 focus:outline-none transition-colors relative cursor-pointer border-b border-amber-900/20',
                        notification.isNew && 'bg-gradient-to-r from-amber-900/15 to-transparent',
                        notification.animationVariant === 'premium' && 'premium-animation',
                        notification.animationVariant === 'highlight' && 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]',
                        notification.animationVariant === 'promotional' && 'border-green-500/50',
                        notification.animationVariant === 'important' && 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
                        isSelected && 'bg-amber-900/30'
                    )}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    type="button"
                    aria-label={`${notification.title} notification ${notification.isNew ? ' (New)' : ''}`}
                >
                    <div className="flex">
                        {isSelectionMode && (
                            <div className="flex-shrink-0 mt-1 mr-3">
                                <div className={cn(
                                    "w-5 h-5 rounded-full border border-amber-500/50 flex items-center justify-center transition-colors",
                                    isSelected && "bg-amber-500 border-amber-500"
                                )}>
                                    {isSelected && <CheckCheck className="w-3 h-3 text-black" />}
                                </div>
                            </div>
                        )}
                        <div className="flex-shrink-0 mt-1 mr-3">
                            {notification.iconComponent}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <h4 className="font-medium truncate transition-colors text-amber-300 group-hover:text-amber-200">
                                    {notification.title}
                                    {notification.isNew && <span className="sr-only"> (New)</span>}
                                </h4>
                                {notification.isNew && (
                                    <motion.span
                                        initial={{ scale: 1, opacity: 0.9 }}
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.9, 1, 0.9]
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                                        className="flex-shrink-0 ml-2 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]"
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                            <p className="mt-1 text-sm text-gray-400 transition-colors group-hover:text-gray-300">
                                {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-amber-500/70">
                                    {notification.timeSince}
                                </span>

                                {/* Action button */}
                                {notification.actionLabel && (
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto px-0 py-0 text-xs text-amber-400 hover:text-amber-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (notification.actionUrl) {
                                                window.location.href = notification.actionUrl;
                                            }
                                        }}
                                        asChild
                                    >
                                        <div className="inline-flex items-center">
                                            {notification.actionLabel}
                                            <ChevronRight className="w-3 h-3 ml-1" />
                                        </div>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Premium animation overlay for special notifications */}
                    {notification.animationVariant === 'premium' && (
                        <motion.div
                            className="absolute inset-0 -translate-x-full opacity-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent"
                            initial={false}
                            animate={{
                                opacity: 1,
                                translateX: ['100%', '-100%'],
                                transition: { duration: 1.5, repeat: Infinity }
                            }}
                        />
                    )}
                </button>

                {/* Actions dropdown menu */}
                {!isSelectionMode && (
                    <div className="absolute transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-6 h-6 p-0 text-gray-400 hover:text-gray-300 hover:bg-amber-900/20"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="w-4 h-4" />
                                    <span className="sr-only">Notification actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-gradient-to-b from-[#0a0605]/95 to-[#100a0a]/98 border-amber-800/40 text-xs"
                            >
                                {notification.isNew && (
                                    <DropdownMenuItem
                                        className="flex items-center gap-2 cursor-pointer text-amber-200 hover:text-amber-100"
                                        onClick={() => onMarkAsRead(notification.id)}
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" />
                                        Mark as read
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300"
                                    onClick={() => onArchive(notification.id)}
                                >
                                    <Archive className="w-3.5 h-3.5" />
                                    Archive
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-amber-900/20" />
                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-red-400 cursor-pointer hover:text-red-300"
                                    onClick={() => onDelete(notification.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </motion.div>
        );
    };

// Helper function to get notification type icon and label
const getNotificationTypeInfo = (type: NotificationType | 'all') => {
    const iconClasses = "w-4 h-4 mr-2";

    switch (type) {
        case 'bonus':
            return {
                icon: <GiCoins className={cn(iconClasses, "text-yellow-400")} />,
                label: 'Bonuses',
                color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
            };
        case 'tournament':
            return {
                icon: <GiDiamonds className={cn(iconClasses, "text-blue-400")} />,
                label: 'Tournaments',
                color: 'bg-blue-400/20 text-blue-400 border-blue-400/30'
            };
        case 'promo':
            return {
                icon: <span className={cn(iconClasses, "text-green-400")}>%</span>,
                label: 'Promotions',
                color: 'bg-green-400/20 text-green-400 border-green-400/30'
            };
        case 'achievement':
            return {
                icon: <span className={cn(iconClasses, "text-purple-400")}>🏆</span>,
                label: 'Achievements',
                color: 'bg-purple-400/20 text-purple-400 border-purple-400/30'
            };
        case 'game':
            return {
                icon: <GiBallGlow className={cn(iconClasses, "text-cyan-400")} />,
                label: 'Games',
                color: 'bg-cyan-400/20 text-cyan-400 border-cyan-400/30'
            };
        case 'system':
            return {
                icon: <GiInfo className={cn(iconClasses, "text-gray-400")} />,
                label: 'System',
                color: 'bg-gray-400/20 text-gray-400 border-gray-400/30'
            };
        case 'account':
            return {
                icon: <GiPerson className={cn(iconClasses, "text-orange-400")} />,
                label: 'Account',
                color: 'bg-orange-400/20 text-orange-400 border-orange-400/30'
            };
        case 'vip':
            return {
                icon: <GiCrown className={cn(iconClasses, "text-amber-400")} />,
                label: 'VIP',
                color: 'bg-amber-400/20 text-amber-400 border-amber-400/30'
            };
        case 'reward':
            return {
                icon: <GiMoneyStack className={cn(iconClasses, "text-emerald-400")} />,
                label: 'Rewards',
                color: 'bg-emerald-400/20 text-emerald-400 border-emerald-400/30'
            };
        case 'all':
        default:
            return {
                icon: <Bell className={cn(iconClasses, "text-amber-400")} />,
                label: 'All',
                color: 'bg-amber-400/20 text-amber-400 border-amber-400/30'
            };
    }
};

// Empty state component
const EmptyState: React.FC<{
    message: string;
    icon?: React.ReactNode;
}> = ({ message, icon = <Bell className="w-12 h-12 text-amber-500/30" /> }) => (
    <div className="flex flex-col items-center justify-center py-16">
        <div className="p-6 mb-4 rounded-full bg-amber-950/30">
            {icon}
        </div>
        <p className="max-w-md text-center text-gray-400">{message}</p>
    </div>
);

// Notification content display component
const NotificationContent = ({
    error,
    isLoading,
    filteredNotifications,
    searchQuery,
    noResultsMessage,
    emptyMessage,
    selectedIds,
    onToggleSelect,
    isSelectionMode,
    markAsRead,
    deleteNotification,
    archiveNotification,
    icon
}: {
    error: string | null;
    isLoading: boolean;
    filteredNotifications: EnrichedNotification[];
    searchQuery: string;
    noResultsMessage: string;
    emptyMessage: string;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    isSelectionMode: boolean;
    markAsRead: (id: string) => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    archiveNotification: (id: string) => Promise<void>;
    icon?: React.ReactNode;
}) => {
    if (error) {
        return (
            <EmptyState
                message="There was an error loading your notifications. Please try again later."
                icon={<X className="w-12 h-12 text-red-500/30" />}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-t-2 border-b-2 rounded-full animate-spin border-amber-500"></div>
            </div>
        );
    }

    if (filteredNotifications.length === 0) {
        return (
            <EmptyState
                message={searchQuery ? noResultsMessage : emptyMessage}
                icon={icon || <Bell className="w-12 h-12 text-amber-500/30" />}
            />
        );
    }

    return (
        <div className="space-y-px border-t border-amber-900/20">
            {filteredNotifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    onArchive={archiveNotification}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    isSelectionMode={isSelectionMode}
                />
            ))}
        </div>
    );
};

// Action buttons component for header
const ActionButtons = ({
    isSelectionMode,
    selectedIds,
    handleDeselectAll,
    handleSelectAll,
    handleMarkSelectedAsRead,
    handleArchiveSelected,
    handleDeleteSelected,
    searchQuery,
    setSearchQuery,
    setIsSelectionMode,
    counts,
    handleMarkAllAsRead,
    preferencesOpen,
    setPreferencesOpen,
    filterType,
    getTypeCount,
    setFilterType
}: {
    isSelectionMode: boolean;
    selectedIds: Set<string>;
    handleDeselectAll: () => void;
    handleSelectAll: () => void;
    handleMarkSelectedAsRead: () => Promise<void>;
    handleArchiveSelected: () => Promise<void>;
    handleDeleteSelected: () => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    setIsSelectionMode: (mode: boolean) => void;
    counts: { unread: number };
    handleMarkAllAsRead: () => Promise<void>;
    preferencesOpen: boolean;
    setPreferencesOpen: (open: boolean) => void;
    filterType: NotificationType | 'all';
    getTypeCount: (type: NotificationType | 'all') => number;
    setFilterType: (type: NotificationType | 'all') => void;
}) => {
    if (isSelectionMode) {
        return (
            <>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="border-amber-700/50 hover:bg-amber-900/20"
                >
                    Cancel
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="border-amber-700/50 hover:bg-amber-900/20"
                >
                    Select All
                </Button>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkSelectedAsRead}
                                disabled={selectedIds.size === 0}
                                className="border-amber-700/50 hover:bg-amber-900/20"
                            >
                                <CheckCheck className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark as Read</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleArchiveSelected}
                                disabled={selectedIds.size === 0}
                                className="border-amber-700/50 hover:bg-amber-900/20"
                            >
                                <Archive className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Archive</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeleteSelected}
                                disabled={selectedIds.size === 0}
                                className="border-amber-700/50 hover:bg-amber-900/20 hover:text-red-400"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Delete</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </>
        );
    }

    return (
        <>
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    placeholder="Search notifications"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 bg-black/20 border-amber-800/30 focus-visible:ring-amber-600"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 h-full px-2 text-gray-500 hover:text-gray-300"
                        onClick={() => setSearchQuery('')}
                    >
                        <X className="w-4 h-4" />
                        <span className="sr-only">Clear search</span>
                    </Button>
                )}
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-700/50 hover:bg-amber-900/20"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Filter</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gradient-to-b from-[#0a0605]/95 to-[#100a0a]/98 border-amber-800/40">
                    <div className="px-2 py-1.5 text-xs text-gray-400">Filter by type</div>
                    <DropdownMenuSeparator className="bg-amber-900/20" />
                    {(['all', 'bonus', 'tournament', 'promo', 'achievement', 'game', 'system', 'account', 'vip', 'reward'] as const).map((type) => {
                        const typeInfo = getNotificationTypeInfo(type);
                        const count = getTypeCount(type);
                        return (
                            <DropdownMenuItem
                                key={type}
                                className={cn(
                                    "flex items-center gap-2 cursor-pointer",
                                    filterType === type ? "text-amber-300" : "text-gray-300"
                                )}
                                onClick={() => setFilterType(type)}
                            >
                                {typeInfo.icon}
                                {typeInfo.label}
                                <Badge variant="outline" className="ml-auto">
                                    {count}
                                </Badge>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>

            <Button
                variant="outline"
                size="sm"
                className="border-amber-700/50 hover:bg-amber-900/20"
                onClick={() => setIsSelectionMode(true)}
            >
                <CheckCheck className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Select</span>
            </Button>

            {counts.unread > 0 && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="border-amber-700/50 hover:bg-amber-900/20"
                            >
                                <CheckCheck className="w-4 h-4" />
                                <span className="hidden sm:inline">Mark All Read</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Mark All as Read</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-700/50 hover:bg-amber-900/20"
                    >
                        <Settings className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">Settings</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl bg-[#0a0605] border-amber-800/40">
                    <DialogTitle className="text-amber-300">
                        Notification Preferences
                    </DialogTitle>
                    <NotificationPreferences isDialog={true} />
                </DialogContent>
            </Dialog>
        </>
    );
};

// Custom hook for notification filtering
function useNotificationFiltering(
    notifications: EnrichedNotification[],
    activeTab: 'all' | 'unread' | 'read' | 'archived',
    filterType: NotificationType | 'all',
    searchQuery: string,
    filterByStatus: (status: 'unread' | 'read' | 'archived') => EnrichedNotification[],
    filterByType: (type: NotificationType | 'all') => EnrichedNotification[]
) {
    // Get filtered notifications
    const getFilteredNotifications = () => {
        let filtered = notifications;

        if (activeTab !== 'all') {
            filtered = filterByStatus(activeTab);
        }

        if (filterType !== 'all') {
            filtered = filterByType(filterType);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(query) ||
                n.message.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    // Sort by creation date
    const filteredNotifications = getFilteredNotifications()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { filteredNotifications };
}

/**
 * Main Notifications Page Component
 * Displays all notifications with filtering and bulk actions
 */
export default function NotificationsPage() {
    // Access notifications from the store
    const {
        notifications,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        archiveNotification,
        filterByType,
        filterByStatus
    } = useNotifications();

    // State for UI
    const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read' | 'archived'>('all');
    const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [preferencesOpen, setPreferencesOpen] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Create a wrapper for filterByType that handles the 'all' case
    const handleFilterByType = (type: NotificationType | 'all') => {
        if (type === 'all') {
            return notifications; // Return all notifications for 'all' type
        }
        return filterByType(type);
    };

    // Get filtered notifications using custom hook
    const { filteredNotifications } = useNotificationFiltering(
        notifications,
        activeTab,
        filterType,
        searchQuery,
        filterByStatus,
        handleFilterByType
    );

    // Selection handlers
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };

    const handleSelectAll = () => {
        const filteredIds = filteredNotifications.map(n => n.id);
        setSelectedIds(new Set(filteredIds));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    // Batch action handlers
    const resetSelection = () => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    };

    const handleDeleteSelected = async () => {
        const promises = Array.from(selectedIds).map(id => deleteNotification(id));
        await Promise.all(promises);
        resetSelection();
    };

    const handleArchiveSelected = async () => {
        const promises = Array.from(selectedIds).map(id => archiveNotification(id));
        await Promise.all(promises);
        resetSelection();
    };

    const handleMarkSelectedAsRead = async () => {
        const promises = Array.from(selectedIds).map(id => markAsRead(id));
        await Promise.all(promises);
        resetSelection();
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    // Get count for each status
    const counts = {
        all: notifications.length,
        unread: notifications.filter(n => n.status === 'unread').length,
        read: notifications.filter(n => n.status === 'read').length,
        archived: notifications.filter(n => n.status === 'archived').length
    };

    // Get counts by type
    const getTypeCount = (type: NotificationType | 'all') => {
        if (type === 'all') return notifications.length;
        return notifications.filter(n => n.type === type).length;
    };

    return (
        <div className="container max-w-5xl px-4 pt-24 pb-8 mx-auto sm:px-6">
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex flex-col items-start justify-between">
                        <div>
                            <h1 className="font-semibold text-amber-300">Notifications</h1>
                            <p className="text-gray-400">
                                {counts.all} {counts.all === 1 ? 'notification' : 'notifications'}
                                {counts.unread > 0 && <span>, {counts.unread} unread</span>}
                            </p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3">
                        <ActionButtons
                            isSelectionMode={isSelectionMode}
                            selectedIds={selectedIds}
                            handleDeselectAll={handleDeselectAll}
                            handleSelectAll={handleSelectAll}
                            handleMarkSelectedAsRead={handleMarkSelectedAsRead}
                            handleArchiveSelected={handleArchiveSelected}
                            handleDeleteSelected={handleDeleteSelected}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            setIsSelectionMode={setIsSelectionMode}
                            counts={counts}
                            handleMarkAllAsRead={handleMarkAllAsRead}
                            preferencesOpen={preferencesOpen}
                            setPreferencesOpen={setPreferencesOpen}
                            filterType={filterType}
                            getTypeCount={getTypeCount}
                            setFilterType={setFilterType}
                        />
                    </div>
                </div>

                {/* Current filter indicator */}
                {filterType !== 'all' && (
                    <div className="flex items-center">
                        <span className="mr-2 text-sm text-gray-400">Filtered by:</span>
                        <Badge className={cn("flex items-center", getNotificationTypeInfo(filterType).color)}>
                            {getNotificationTypeInfo(filterType).icon}
                            {getNotificationTypeInfo(filterType).label}
                            <Button
                                size="sm"
                                className="h-auto p-0 ml-1 hover:bg-transparent"
                                onClick={() => setFilterType('all')}
                            >
                                <X className="w-3 h-3" />
                                <span className="sr-only">Clear filter</span>
                            </Button>
                        </Badge>
                    </div>
                )}

                {/* Tabs */}
                <Tabs
                    value={activeTab}
                    onValueChange={(value) => setActiveTab(value as 'all' | 'unread' | 'read' | 'archived')}
                    className="w-full border bg-black/20 border-amber-800/30"
                >
                    <TabsList className="border bg-black/20 border-amber-800/30">
                        <TabsTrigger
                            value="all"
                            className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300"
                        >
                            All
                            <Badge variant="outline" className="ml-2 bg-transparent">
                                {counts.all}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="unread"
                            className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300"
                        >
                            Unread
                            <Badge variant="outline" className="ml-2 bg-transparent">
                                {counts.unread}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="read"
                            className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300"
                        >
                            Read
                            <Badge variant="outline" className="ml-2 bg-transparent">
                                {counts.read}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="archived"
                            className="data-[state=active]:bg-amber-900/30 data-[state=active]:text-amber-300"
                        >
                            Archived
                            <Badge variant="outline" className="ml-2 bg-transparent">
                                {counts.archived}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4">
                        <NotificationContent
                            error={error}
                            isLoading={isLoading}
                            filteredNotifications={filteredNotifications}
                            searchQuery={searchQuery}
                            noResultsMessage="No notifications match your search criteria."
                            emptyMessage="You don't have any notifications yet."
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            isSelectionMode={isSelectionMode}
                            markAsRead={markAsRead}
                            deleteNotification={deleteNotification}
                            archiveNotification={archiveNotification}
                        />
                    </TabsContent>

                    <TabsContent value="unread" className="mt-4">
                        <NotificationContent
                            error={error}
                            isLoading={isLoading}
                            filteredNotifications={filteredNotifications}
                            searchQuery={searchQuery}
                            noResultsMessage="No unread notifications match your search criteria."
                            emptyMessage="You don't have any unread notifications."
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            isSelectionMode={isSelectionMode}
                            markAsRead={markAsRead}
                            deleteNotification={deleteNotification}
                            archiveNotification={archiveNotification}
                            icon={<CheckCheck className="w-12 h-12 text-amber-500/30" />}
                        />
                    </TabsContent>

                    <TabsContent value="read" className="mt-4">
                        <NotificationContent
                            error={error}
                            isLoading={isLoading}
                            filteredNotifications={filteredNotifications}
                            searchQuery={searchQuery}
                            noResultsMessage="No read notifications match your search criteria."
                            emptyMessage="You don't have any read notifications."
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            isSelectionMode={isSelectionMode}
                            markAsRead={markAsRead}
                            deleteNotification={deleteNotification}
                            archiveNotification={archiveNotification}
                        />
                    </TabsContent>

                    <TabsContent value="archived" className="mt-4">
                        <NotificationContent
                            error={error}
                            isLoading={isLoading}
                            filteredNotifications={filteredNotifications}
                            searchQuery={searchQuery}
                            noResultsMessage="No archived notifications match your search criteria."
                            emptyMessage="You don't have any archived notifications."
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            isSelectionMode={isSelectionMode}
                            markAsRead={markAsRead}
                            deleteNotification={deleteNotification}
                            archiveNotification={archiveNotification}
                            icon={<Archive className="w-12 h-12 text-amber-500/30" />}
                        />
                    </TabsContent>
                </Tabs>

                {/* Bulk actions footer */}
                {isSelectionMode && selectedIds.size > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 border-t bg-black/90 border-amber-900/40">
                        <div className="container flex items-center justify-between max-w-5xl mx-auto">
                            <div className="text-amber-300">
                                {selectedIds.size} {selectedIds.size === 1 ? 'notification' : 'notifications'} selected
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleMarkSelectedAsRead}
                                    className="border-amber-700/50 hover:bg-amber-900/20"
                                >
                                    <CheckCheck className="w-4 h-4 mr-2" />
                                    Mark as Read
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleArchiveSelected}
                                    className="border-amber-700/50 hover:bg-amber-900/20"
                                >
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteSelected}
                                    className="border-amber-700/50 hover:bg-amber-900/20 hover:text-red-400"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}