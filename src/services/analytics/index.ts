import EventTracker from './eventTracker';

// Export the analytics service instance
export const analyticsService = EventTracker.getInstance();

// Export types for external use
export type {
    EventCategory,
    EventProperties,
    EventData,
    EventHandler,
    EventTrackerConfig
} from './eventTracker';

export default EventTracker;