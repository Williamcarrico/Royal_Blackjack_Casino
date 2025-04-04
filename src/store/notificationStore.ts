// lib/store/notificationStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
    Notification,
    NotificationState,
    NotificationActions,
    NotificationType,
    NotificationPreferences,
    CreateNotificationRequest,
    NotificationPriority
} from '@/types/notifications';
import { notificationService } from '@/services/notificationService';

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
    enabled: true,
    pushEnabled: true,
    emailEnabled: true,
    soundEnabled: true,
    showPreview: true,
    typePreferences: {
        bonus: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        tournament: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        promo: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        system: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        achievement: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        game: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        account: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'medium' },
        vip: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
        reward: { enabled: true, pushEnabled: true, emailEnabled: true, minPriority: 'low' },
    },
};

// Initial state
const initialState: NotificationState = {
    notifications: [],
    unseenCount: 0,
    isLoading: false,
    error: null,
    lastUpdated: null,
    preferences: DEFAULT_PREFERENCES,
};

// Create notification store with persistence
export const useNotificationStore = create<NotificationState & NotificationActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Fetch notifications from API
            fetchNotifications: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const data: Notification[] = await notificationService.getNotifications();

                    // Calculate unseen count
                    const unseenCount = data.filter(n => n.status === 'unread').length;

                    set({
                        notifications: data,
                        unseenCount,
                        isLoading: false,
                        lastUpdated: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Failed to fetch notifications:', error);
                    set({
                        isLoading: false,
                        error: error instanceof Error ? error.message : 'Failed to fetch notifications'
                    });
                }
            },

            // Mark notification as read
            markAsRead: async (id: string) => {
                try {
                    const { notifications } = get();
                    const updatedNotifications: Notification[] = notifications.map(notification =>
                        notification.id === id
                            ? { ...notification, status: 'read' as const, isNew: false }
                            : notification
                    );

                    // Optimistic update
                    set({
                        notifications: updatedNotifications,
                        unseenCount: updatedNotifications.filter(n => n.status === 'unread').length
                    });

                    // Update on server
                    await notificationService.markAsRead(id);
                } catch (error) {
                    console.error('Failed to mark notification as read:', error);
                    // Rollback not implemented here, but would refetch notifications
                    set({
                        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
                    });
                }
            },

            // Mark all notifications as read
            markAllAsRead: async () => {
                try {
                    const { notifications } = get();
                    const updatedNotifications: Notification[] = notifications.map(notification => ({
                        ...notification,
                        status: 'read' as const,
                        isNew: false
                    }));

                    // Optimistic update
                    set({ notifications: updatedNotifications, unseenCount: 0 });

                    // Update on server
                    await notificationService.markAllAsRead();
                } catch (error) {
                    console.error('Failed to mark all notifications as read:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to mark all as read'
                    });
                }
            },

            // Delete notification
            deleteNotification: async (id: string) => {
                try {
                    const { notifications } = get();

                    // Optimistic update
                    const updatedNotifications: Notification[] = notifications.filter(n => n.id !== id);
                    set({
                        notifications: updatedNotifications,
                        unseenCount: updatedNotifications.filter(n => n.status === 'unread').length
                    });

                    // Update on server
                    await notificationService.deleteNotification(id);
                } catch (error) {
                    console.error('Failed to delete notification:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to delete notification'
                    });
                }
            },

            // Clear all notifications
            clearAll: async () => {
                try {
                    // Optimistic update
                    set({ notifications: [], unseenCount: 0 });

                    // Update on server
                    await notificationService.clearAll();
                } catch (error) {
                    console.error('Failed to clear all notifications:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to clear all notifications'
                    });
                    // Refetch to recover from error
                    get().fetchNotifications();
                }
            },

            // Archive notification
            archiveNotification: async (id: string) => {
                try {
                    const { notifications } = get();
                    const updatedNotifications: Notification[] = notifications.map(notification =>
                        notification.id === id
                            ? { ...notification, status: 'archived' as const }
                            : notification
                    );

                    // Optimistic update
                    set({
                        notifications: updatedNotifications,
                        unseenCount: updatedNotifications.filter(n => n.status === 'unread').length
                    });

                    // Update on server
                    await notificationService.archiveNotification(id);
                } catch (error) {
                    console.error('Failed to archive notification:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to archive notification'
                    });
                }
            },

            // Add notification (create a new one)
            addNotification: async (notification: CreateNotificationRequest) => {
                try {
                    // We'll use the service to create it first to get the ID
                    const newNotification: Notification = await notificationService.createNotification(notification);

                    // Add to existing notifications
                    const { notifications } = get();
                    set({
                        notifications: [newNotification, ...notifications],
                        unseenCount: get().unseenCount + 1
                    });

                    // Trigger sound effect if enabled
                    if (get().preferences.soundEnabled) {
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.play().catch(e => console.log('Error playing notification sound:', e));
                    }
                } catch (error) {
                    console.error('Failed to add notification:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to add notification'
                    });
                }
            },

            // Update notification preferences
            updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
                try {
                    const currentPreferences = get().preferences;
                    const updatedPreferences = { ...currentPreferences, ...preferences };

                    // Update locally first
                    set({ preferences: updatedPreferences });

                    // Update on server
                    await notificationService.updatePreferences(updatedPreferences);
                } catch (error) {
                    console.error('Failed to update notification preferences:', error);
                    set({
                        error: error instanceof Error ? error.message : 'Failed to update preferences'
                    });
                }
            },

            // Toggle specific notification type
            toggleNotificationType: async (type: NotificationType, enabled: boolean) => {
                try {
                    const { preferences } = get();
                    const updatedPreferences = {
                        ...preferences,
                        typePreferences: {
                            ...preferences.typePreferences,
                            [type]: {
                                ...preferences.typePreferences[type],
                                enabled
                            }
                        }
                    };

                    // Update locally first
                    set({ preferences: updatedPreferences });

                    // Update on server
                    await notificationService.updatePreferences(updatedPreferences);
                } catch (error) {
                    console.error(`Failed to toggle ${type} notifications:`, error);
                    set({
                        error: error instanceof Error ? error.message : `Failed to toggle ${type} notifications`
                    });
                }
            },

            // Connect to real-time notification hub
            connectToNotificationHub: () => {
                notificationService.connectToHub((notification: Notification) => {
                    // When receiving a real-time notification, add it to our state
                    const { notifications, preferences } = get();

                    // Check if notification should be shown based on preferences
                    const typePrefs = preferences.typePreferences[notification.type];
                    if (!preferences.enabled || !typePrefs.enabled) {
                        return; // Notification type is disabled
                    }

                    if ((notification.priority as NotificationPriority) < typePrefs.minPriority) {
                        return; // Notification priority too low
                    }

                    // Add the notification to state
                    set({
                        notifications: [notification, ...notifications],
                        unseenCount: get().unseenCount + 1
                    });

                    // Play sound if enabled
                    if (preferences.soundEnabled) {
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.play().catch(e => console.log('Error playing notification sound:', e));
                    }
                });
            },

            // Disconnect from notification hub
            disconnectFromNotificationHub: () => {
                notificationService.disconnectFromHub();
            },
        }),
        {
            name: 'royal-edge-notifications',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                notifications: state.notifications,
                preferences: state.preferences,
            }),
        }
    )
);