/**
 * Event Tracker service for tracking user events and analytics
 */
import { BaseService, ServiceOptions } from '../serviceInterface';

export type EventCategory =
    | 'game'
    | 'bet'
    | 'hand'
    | 'user'
    | 'navigation'
    | 'ui'
    | 'error'
    | 'performance';

export interface EventProperties {
    [key: string]: string | number | boolean | null | undefined;
}

export interface EventData {
    category: EventCategory;
    name: string;
    properties?: EventProperties;
    timestamp: number;
    sessionId: string;
    userId?: string;
}

export type EventHandler = (event: EventData) => void;

export interface EventTrackerConfig extends ServiceOptions {
    sessionId?: string;
    userId?: string;
    endpoint?: string;
    batchSize?: number;
    flushInterval?: number;
    debugMode?: boolean;
}

export default class EventTracker extends BaseService {
    private static instance: EventTracker;
    private sessionId: string;
    private userId?: string;
    private endpoint?: string;
    private eventQueue: EventData[] = [];
    private flushTimeoutId?: NodeJS.Timeout;
    private batchSize: number;
    private flushInterval: number;
    private isFlushInProgress: boolean = false;
    private debugMode: boolean;
    private readonly eventHandlers: EventHandler[] = [];

    private constructor(config: EventTrackerConfig = {}) {
        super(config);

        this.sessionId = config.sessionId ?? this.generateSessionId();
        this.userId = config.userId;
        this.endpoint = config.endpoint;
        this.batchSize = config.batchSize ?? 20;
        this.flushInterval = config.flushInterval ?? 30000; // 30 seconds
        this.debugMode = config.debugMode ?? false;
    }

    public static getInstance(config?: EventTrackerConfig): EventTracker {
        if (!EventTracker.instance) {
            EventTracker.instance = new EventTracker(config);
        }
        return EventTracker.instance;
    }

    protected async initializeImpl(): Promise<void> {
        // Start the auto-flush timer
        this.startFlushTimer();

        // Log initialization
        this.log(`Event tracker initialized with session ID ${this.sessionId}`);
    }

    protected async resetImpl(): Promise<void> {
        // Clear the flush timer
        if (this.flushTimeoutId) {
            clearTimeout(this.flushTimeoutId);
            this.flushTimeoutId = undefined;
        }

        // Clear the event queue
        this.eventQueue = [];

        // Generate a new session ID
        this.sessionId = this.generateSessionId();

        // Log reset
        this.log(`Event tracker reset with new session ID ${this.sessionId}`);
    }

    /**
     * Track an event
     */
    public track(
        category: EventCategory,
        name: string,
        properties?: EventProperties
    ): void {
        const event: EventData = {
            category,
            name,
            properties,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId
        };

        // Add the event to the queue
        this.eventQueue.push(event);

        // Log the event in debug mode
        if (this.debugMode) {
            this.log(`Event tracked: ${category}:${name}`, properties);
        }

        // Call event handlers
        this.eventHandlers.forEach(handler => {
            try {
                handler(event);
            } catch (error) {
                this.logError('Error in event handler', error);
            }
        });

        // Flush if we've reached the batch size
        if (this.eventQueue.length >= this.batchSize) {
            this.flush();
        }
    }

    /**
     * Flush the event queue
     */
    public async flush(): Promise<void> {
        // If there are no events or a flush is already in progress, do nothing
        if (this.eventQueue.length === 0 || this.isFlushInProgress) {
            return;
        }

        // Reset the flush timer
        if (this.flushTimeoutId) {
            clearTimeout(this.flushTimeoutId);
            this.flushTimeoutId = undefined;
        }

        // Start a new flush timer
        this.startFlushTimer();

        // Mark flush as in progress
        this.isFlushInProgress = true;

        // Get events to flush
        const eventsToFlush = [...this.eventQueue];
        this.eventQueue = [];

        try {
            // If we have an endpoint, send the events to it
            if (this.endpoint) {
                await this.sendEvents(eventsToFlush);
            } else {
                // Otherwise, just log them
                this.log(`Events flushed (no endpoint): ${eventsToFlush.length}`);
            }
        } catch (error) {
            // Log the error
            this.logError('Error flushing events', error);

            // Put the events back in the queue
            this.eventQueue = [...eventsToFlush, ...this.eventQueue];
        } finally {
            // Mark flush as complete
            this.isFlushInProgress = false;
        }
    }

    /**
     * Set the user ID
     */
    public setUserId(userId: string): void {
        this.userId = userId;
    }

    /**
     * Generate a new session ID
     */
    public newSession(): string {
        this.sessionId = this.generateSessionId();
        return this.sessionId;
    }

    /**
     * Get the current session ID
     */
    public getSessionId(): string {
        return this.sessionId;
    }

    /**
     * Set the endpoint
     */
    public setEndpoint(endpoint: string): void {
        this.endpoint = endpoint;
    }

    /**
     * Set the batch size
     */
    public setBatchSize(size: number): void {
        this.batchSize = size;
    }

    /**
     * Set the flush interval
     */
    public setFlushInterval(interval: number): void {
        this.flushInterval = interval;

        // Reset the flush timer
        if (this.flushTimeoutId) {
            clearTimeout(this.flushTimeoutId);
            this.flushTimeoutId = undefined;
        }

        this.startFlushTimer();
    }

    /**
     * Enable or disable debug mode
     */
    public setDebugMode(enabled: boolean): void {
        this.debugMode = enabled;
    }

    /**
     * Add an event handler
     */
    public addEventHandler(handler: EventHandler): void {
        this.eventHandlers.push(handler);
    }

    /**
     * Remove an event handler
     */
    public removeEventHandler(handler: EventHandler): void {
        const index = this.eventHandlers.indexOf(handler);

        if (index !== -1) {
            this.eventHandlers.splice(index, 1);
        }
    }

    /**
     * Track page view
     */
    public trackPageView(page: string, referrer?: string): void {
        this.track('navigation', 'page_view', {
            page,
            referrer,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            title: typeof document !== 'undefined' ? document.title : undefined
        });
    }

    /**
     * Track button click
     */
    public trackButtonClick(buttonId: string, buttonText?: string): void {
        this.track('ui', 'button_click', {
            buttonId,
            buttonText
        });
    }

    /**
     * Track game action
     */
    public trackGameAction(
        action: string,
        gameId: string,
        handId?: string,
        amount?: number
    ): void {
        this.track('game', action, {
            gameId,
            handId,
            amount
        });
    }

    /**
     * Track bet
     */
    public trackBet(
        gameId: string,
        amount: number,
        betType: string,
        handId?: string
    ): void {
        this.track('bet', 'place_bet', {
            gameId,
            amount,
            betType,
            handId
        });
    }

    /**
     * Track error
     */
    public trackError(
        errorType: string,
        errorMessage: string,
        errorStack?: string
    ): void {
        this.track('error', errorType, {
            message: errorMessage,
            stack: errorStack
        });
    }

    /**
     * Track performance metric
     */
    public trackPerformance(
        metricName: string,
        value: number,
        context?: EventProperties
    ): void {
        this.track('performance', metricName, {
            value,
            ...context
        });
    }

    /**
     * Clear all events
     */
    public clearEvents(): void {
        this.eventQueue = [];
    }

    /**
     * Get the number of pending events
     */
    public getPendingEventCount(): number {
        return this.eventQueue.length;
    }

    private async sendEvents(events: EventData[]): Promise<void> {
        // If there's no endpoint, do nothing
        if (!this.endpoint) {
            return;
        }

        // Log the request
        this.log(`Sending ${events.length} events to ${this.endpoint}`);

        // Send the events to the endpoint
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events,
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
            }

            this.log(`Successfully sent ${events.length} events`);
        } catch (error) {
            this.logError('Error sending events', error);
            throw error;
        }
    }

    private startFlushTimer(): void {
        if (this.flushInterval > 0) {
            this.flushTimeoutId = setTimeout(() => {
                this.flush();
            }, this.flushInterval);
        }
    }

    private generateSessionId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}