// lib/services/notificationService.ts

import {
    Notification,
    CreateNotificationRequest,
    NotificationPreferences
} from '@/types/notifications';

// Mock API url - replace with your actual API endpoints
const API_BASE_URL = 'api/notifications';

class NotificationService {
    private hubConnection: WebSocket | null = null;
    private notificationCallbacks: ((notification: Notification) => void)[] = [];
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private isConnecting = false;

    /**
     * Fetch all notifications for the current user
     */
    async getNotifications(): Promise<Notification[]> {
        try {
            // Check if we're in development mode
            if (process.env.NODE_ENV === 'development') {
                console.log('Using mock notifications in development mode');
                // Return empty array in development mode to avoid API calls
                return [];
            }

            const response = await fetch(`${API_BASE_URL}`);

            if (!response.ok) {
                throw new Error(`Error fetching notifications: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Return empty array instead of throwing to prevent crashes
            return [];
        }
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string): Promise<void> {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error marking notification as read: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<void> {
        try {
            const response = await fetch(`/api/notifications/read-all`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error marking all notifications as read: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
            throw error;
        }
    }

    /**
     * Delete a specific notification
     */
    async deleteNotification(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error deleting notification: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    }

    /**
     * Clear all notifications
     */
    async clearAll(): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/clear-all`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error(`Error clearing all notifications: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
            throw error;
        }
    }

    /**
     * Archive a notification
     */
    async archiveNotification(id: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/${id}/archive`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Error archiving notification: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to archive notification:', error);
            throw error;
        }
    }

    /**
     * Create a new notification
     */
    async createNotification(notification: CreateNotificationRequest): Promise<Notification> {
        try {
            // Check if we're in development mode
            if (process.env.NODE_ENV === 'development') {
                // Generate a mock notification without making an API call
                console.log('Using mock notification in development mode');
                return {
                    id: `notification-${Date.now()}`,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    priority: notification.priority || 'medium',
                    status: 'unread',
                    isNew: true,
                    createdAt: new Date().toISOString(),
                    expiresAt: null,
                    actions: [],
                    metadata: {}
                };
            }

            // Real API call for production
            const response = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(notification),
            });

            if (!response.ok) {
                throw new Error(`Error creating notification: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to create notification:', error);
            // Return a fallback notification instead of throwing
            return {
                id: `fallback-${Date.now()}`,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority || 'medium',
                status: 'unread',
                isNew: true,
                createdAt: new Date().toISOString(),
                expiresAt: null,
                actions: [],
                metadata: {}
            };
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences: NotificationPreferences): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(preferences),
            });

            if (!response.ok) {
                throw new Error(`Error updating preferences: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to update notification preferences:', error);
            throw error;
        }
    }

    /**
     * Get user's notification preferences
     */
    async getPreferences(): Promise<NotificationPreferences> {
        try {
            const response = await fetch(`${API_BASE_URL}/preferences`);

            if (!response.ok) {
                throw new Error(`Error fetching preferences: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to fetch notification preferences:', error);
            throw error;
        }
    }

    /**
     * Connect to real-time notifications via WebSocket
     */
    connectToHub(callback: (notification: Notification) => void): void {
        // Register the callback
        this.notificationCallbacks.push(callback);

        // Only connect if not already connected or connecting
        if (this.hubConnection || this.isConnecting) return;

        this.isConnecting = true;
        this.establishWebSocketConnection();
    }

    /**
     * Establish WebSocket connection with error handling and reconnection logic
     */
    private establishWebSocketConnection(): void {
        try {
            // Create WebSocket connection
            // In production, use wss:// for secure connections
            const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/notifications/hub`;
            console.log(`Attempting to connect to WebSocket at: ${wsUrl}`);

            // Check if we're in a testing/development environment
            const isDevMode = process.env.NODE_ENV === 'development';

            if (isDevMode) {
                // In development, make a preflight HTTP request to check if the endpoint exists
                fetch('/api/notifications/hub')
                    .then(response => {
                        if (response.status === 200) {
                            console.log('WebSocket simulation endpoint available. Using simulated mode.');
                            // Endpoint exists but is simulated, no actual WebSocket connection
                            this.setupSimulatedConnection();
                        } else {
                            // Try to establish a real WebSocket connection
                            this.createWebSocketConnection(wsUrl);
                        }
                    })
                    .catch(error => {
                        console.warn('WebSocket endpoint check failed:', error);
                        this.setupSimulatedConnection();
                    });
            } else {
                // In production, directly try to establish a WebSocket connection
                this.createWebSocketConnection(wsUrl);
            }
        } catch (error) {
            console.error('Error establishing WebSocket connection:', error);
            this.isConnecting = false;

            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        }
    }

    /**
     * Creates an actual WebSocket connection
     */
    private createWebSocketConnection(wsUrl: string): void {
        this.hubConnection = new WebSocket(wsUrl);

        this.hubConnection.onopen = () => {
            console.log('WebSocket connection established successfully');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
        };

        this.hubConnection.onmessage = (event) => {
            try {
                const notification = JSON.parse(event.data) as Notification;
                // Notify all registered callbacks
                this.notificationCallbacks.forEach(cb => cb(notification));
            } catch (error) {
                console.error('Error processing incoming notification:', error);
            }
        };

        this.hubConnection.onerror = (event) => {
            // Limit error logging to avoid console spam
            if (this.reconnectAttempts === 0 || this.reconnectAttempts === this.maxReconnectAttempts - 1) {
                const errorDetails = JSON.stringify(event);
                console.error(`WebSocket error: ${errorDetails || 'No error details available'}`);

                // If in development, provide debugging hints
                if (process.env.NODE_ENV === 'development') {
                    console.info('WebSocket connection failed. Possible causes:');
                    console.info('1. WebSocket server endpoint (/api/notifications/hub) may not exist');
                    console.info('2. WebSocket server may not be running');
                    console.info('3. Network issues or firewall restrictions');
                    console.info('4. Cross-origin (CORS) policy restrictions');
                }
            }
        };

        this.hubConnection.onclose = (event) => {
            console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
            this.isConnecting = false;
            this.hubConnection = null;

            // Attempt to reconnect with exponential backoff
            if (this.notificationCallbacks.length > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.warn(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. WebSocket reconnection abandoned.`);
            }
        };
    }

    /**
     * Sets up a simulated WebSocket connection for development
     */
    private setupSimulatedConnection(): void {
        console.log('Using simulated WebSocket connection for development');
        // Simulate a successful connection
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // We won't create an actual WebSocket object, but set a flag
        // to indicate we're in simulation mode
        this.hubConnection = {
            readyState: WebSocket.OPEN,
            send: (data: string) => {
                console.log('Simulated WebSocket send:', data);
            },
            close: () => {
                console.log('Simulated WebSocket connection closed');
            }
        } as unknown as WebSocket;

        // Let the user know we're in simulation mode
        console.info('Notification WebSocket is running in simulation mode.');
        console.info('Real-time notifications are not available in development.');
    }

    /**
     * Schedules a reconnection attempt with exponential backoff
     */
    private scheduleReconnect(): void {
        const delay = Math.min(30000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
        this.reconnectAttempts++;

        console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

        setTimeout(() => {
            if (!this.hubConnection && !this.isConnecting) {
                this.isConnecting = true;
                this.establishWebSocketConnection();
            }
        }, delay);
    }

    /**
     * Disconnect from the notification hub
     */
    disconnectFromHub(): void {
        if (!this.hubConnection) return;

        // Reset reconnection state
        this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect

        this.hubConnection.close(1000, 'Client disconnected intentionally');
        this.hubConnection = null;
        this.notificationCallbacks = [];
        this.isConnecting = false;
    }

    /**
     * Check if WebSocket is currently connected
     */
    isConnected(): boolean {
        return !!this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN;
    }

    /**
     * For testing: simulate receiving a real-time notification
     */
    simulateRealTimeNotification(notification: Notification): void {
        this.notificationCallbacks.forEach(cb => cb(notification));
    }
}

// Singleton instance
export const notificationService = new NotificationService();