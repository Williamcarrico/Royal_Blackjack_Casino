// types/notifications.ts

/**
 * Notification types representing different casino events
 */
export type NotificationType =
    | 'bonus'        // Daily/weekly bonuses, promotions
    | 'tournament'   // Tournament announcements, results
    | 'promo'        // Special promotional offers
    | 'system'       // System updates, maintenance
    | 'achievement'  // Player achievements, milestones
    | 'game'         // Game-related notifications (big wins, etc.)
    | 'account'      // Account-related notifications
    | 'vip'          // VIP program notifications
    | 'reward'       // Reward redemptions, chip awards

/**
 * Notification priority levels
 */
export type NotificationPriority =
    | 'low'          // Informational, non-urgent
    | 'medium'       // Default priority
    | 'high'         // Important announcements
    | 'critical'     // Critical system messages

/**
 * Notification status tracking
 */
export type NotificationStatus =
    | 'unread'       // New, not yet seen
    | 'read'         // Seen but not acted upon
    | 'archived'     // User has archived
    | 'actioned'     // User has taken action on this notification

/**
 * Notification metadata value types
 */
export type MetadataValue = string | number | boolean | null | { [key: string]: MetadataValue } | MetadataValue[];

/**
 * Core notification interface
 */
export interface Notification {
    id: string;                   // Unique identifier
    title: string;                // Short, attention-grabbing title
    message: string;              // Main notification content
    type: NotificationType;       // Category of notification
    priority: NotificationPriority; // Importance level
    status: NotificationStatus;   // Current status
    createdAt: string;            // ISO timestamp of creation
    expiresAt?: string;           // Optional expiration time
    imageUrl?: string;            // Optional image or icon URL
    actionUrl?: string;           // Deep link to relevant page/action
    actionLabel?: string;         // Text for action button
    metadata?: Record<string, MetadataValue>; // Additional data specific to notification type
    isNew?: boolean;              // Deprecated: use status instead
}

/**
 * Display-oriented notification with computed properties
 */
export interface EnrichedNotification extends Notification {
    isNew: boolean;               // Computed from status === 'unread'
    timeSince: string;            // Human-readable time (e.g. "2 hours ago")
    formattedCreatedAt: string;   // Formatted date/time
    iconComponent: React.ReactNode; // Resolved icon component
    animationVariant: string;     // Animation style based on type/priority
}

/**
 * Request to create a new notification
 */
export interface CreateNotificationRequest {
    title: string;
    message: string;
    type: NotificationType;
    priority?: NotificationPriority;
    expiresAt?: string;
    imageUrl?: string;
    actionUrl?: string;
    actionLabel?: string;
    metadata?: Record<string, MetadataValue>;
    userId?: string; // For targeted notifications
}

/**
 * Notification preferences for users
 */
export interface NotificationPreferences {
    enabled: boolean;                            // Master toggle
    pushEnabled: boolean;                        // Push notifications
    emailEnabled: boolean;                       // Email notifications
    soundEnabled: boolean;                       // Sound effects
    showPreview: boolean;                        // Show content in notification
    doNotDisturbStart?: string;                  // Time-based DND (HH:MM)
    doNotDisturbEnd?: string;                    // Time-based DND (HH:MM)
    typePreferences: Record<NotificationType, {  // Per-type settings
        enabled: boolean;
        pushEnabled: boolean;
        emailEnabled: boolean;
        minPriority: NotificationPriority;
    }>;
}

/**
 * Notification state for store
 */
export interface NotificationState {
    notifications: Notification[];
    unseenCount: number;
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
    preferences: NotificationPreferences;
}

/**
 * Notification store actions
 */
export interface NotificationActions {
    // Fetching
    fetchNotifications: () => Promise<void>;

    // Management
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearAll: () => Promise<void>;
    archiveNotification: (id: string) => Promise<void>;

    // Creation
    addNotification: (notification: CreateNotificationRequest) => Promise<void>;

    // Preferences
    updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
    toggleNotificationType: (type: NotificationType, enabled: boolean) => Promise<void>;

    // Real-time
    connectToNotificationHub: () => void;
    disconnectFromNotificationHub: () => void;
}