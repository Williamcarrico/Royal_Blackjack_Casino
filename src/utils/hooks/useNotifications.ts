import React, { useEffect, useCallback, useMemo } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { formatDistanceToNow, format, parseISO } from 'date-fns';
import type {
    Notification,
    EnrichedNotification,
    NotificationType,
    CreateNotificationRequest} from '@/types/notifications';

// Icons for notification types
import {
    GiCoins,
    GiDiamonds,
    GiBallGlow,
    GiInfo,
    GiPerson,
    GiCrown,
    GiMoneyStack
} from 'react-icons/gi';

/**
 * Custom hook for notification functionality
 */
export function useNotifications() {
    // Access the notification store
    const {
        notifications,
        unseenCount,
        isLoading,
        error,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        archiveNotification,
        addNotification,
        updatePreferences,
        toggleNotificationType,
        connectToNotificationHub,
        disconnectFromNotificationHub
    } = useNotificationStore();

    // Connect to real-time notification hub on mount
    useEffect(() => {
        fetchNotifications();
        connectToNotificationHub();

        // Cleanup on unmount
        return () => {
            disconnectFromNotificationHub();
        };
    }, [fetchNotifications, connectToNotificationHub, disconnectFromNotificationHub]);

    // Get icon component for a notification type
    const getNotificationIcon = useCallback((type: NotificationType): React.ReactNode => {
        switch (type) {
            case 'bonus':
                return React.createElement(GiCoins, { className: "w-5 h-5 text-yellow-400" });
            case 'tournament':
                return React.createElement(GiDiamonds, { className: "w-5 h-5 text-blue-400" });
            case 'promo':
                return React.createElement('span', { className: "w-5 h-5 text-green-400" }, "%");
            case 'achievement':
                return React.createElement('span', { className: "w-5 h-5 text-purple-400" }, "🏆");
            case 'game':
                return React.createElement(GiBallGlow, { className: "w-5 h-5 text-cyan-400" });
            case 'system':
                return React.createElement(GiInfo, { className: "w-5 h-5 text-gray-400" });
            case 'account':
                return React.createElement(GiPerson, { className: "w-5 h-5 text-orange-400" });
            case 'vip':
                return React.createElement(GiCrown, { className: "w-5 h-5 text-amber-400" });
            case 'reward':
                return React.createElement(GiMoneyStack, { className: "w-5 h-5 text-emerald-400" });
            default:
                return React.createElement(GiInfo, { className: "w-5 h-5 text-gray-400" });
        }
    }, []);

    // Animation variant based on notification type and priority
    const getAnimationVariant = useCallback((notification: Notification) => {
        // Different animation styles based on type
        switch (notification.type) {
            case 'bonus':
            case 'vip':
            case 'reward':
                return 'premium'; // Gold shimmer effect
            case 'tournament':
                return 'highlight'; // Blue pulse
            case 'promo':
                return 'promotional'; // Green highlight
            case 'achievement':
                return 'achievement'; // Confetti effect
            case 'account':
            case 'system':
                return notification.priority === 'high' || notification.priority === 'critical'
                    ? 'important' // Red attention
                    : 'standard'; // Normal
            default:
                return 'standard'; // Default animation
        }
    }, []);

    // Create enriched notifications with computed properties
    const enrichedNotifications = useMemo(() => {
        return notifications.map((notification: Notification) => {
            // Parse the date
            const createdDate = parseISO(notification.createdAt);

            // Build enriched notification
            return {
                ...notification,
                isNew: notification.status === 'unread',
                timeSince: formatDistanceToNow(createdDate, { addSuffix: true }),
                formattedCreatedAt: format(createdDate, 'PPpp'),
                iconComponent: getNotificationIcon(notification.type),
                animationVariant: getAnimationVariant(notification)
            } as EnrichedNotification;
        });
    }, [notifications, getNotificationIcon, getAnimationVariant]);

    // Filter notifications by type
    const filterByType = useCallback((type: NotificationType) => {
        return enrichedNotifications.filter((n: EnrichedNotification) => n.type === type);
    }, [enrichedNotifications]);

    // Filter notifications by status
    const filterByStatus = useCallback((status: 'read' | 'unread' | 'archived') => {
        return enrichedNotifications.filter((n: EnrichedNotification) => n.status === status);
    }, [enrichedNotifications]);

    // Create a new notification with default values
    const createNotification = useCallback((
        notification: Omit<CreateNotificationRequest, 'priority'> & { priority?: CreateNotificationRequest['priority'] }
    ) => {
        // Set default priority if not provided
        const notificationWithDefaults: CreateNotificationRequest = {
            ...notification,
            priority: notification.priority || 'medium'
        };

        return addNotification(notificationWithDefaults);
    }, [addNotification]);

    // Create a toast notification (transient, does not persist)
    const toast = useCallback((
        title: string,
        message: string,
        type: NotificationType = 'system',
        autoDismiss: boolean = true
    ) => {
        // Create a transient notification that doesn't persist
        const notification: CreateNotificationRequest = {
            title,
            message,
            type,
            // This notification won't be stored permanently
            metadata: { transient: true, autoDismiss }
        };

        return addNotification(notification);
    }, [addNotification]);

    // Return the hook API
    return {
        // State
        notifications: enrichedNotifications,
        unseenCount,
        isLoading,
        error,
        preferences,

        // Actions
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        archiveNotification,
        createNotification,
        toast,
        updatePreferences,
        toggleNotificationType,

        // Utility functions
        getNotificationIcon,
        filterByType,
        filterByStatus,

        // For standalone usage
        fetchNotifications,
        connectToNotificationHub,
        disconnectFromNotificationHub
    };
}
