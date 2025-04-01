/**
 * Export all service hooks
 */

export {
    default as useService,
    useServiceAvailability,
    useLazyService,
    getTypedService
} from './useService';

export type { ServiceName } from './useService';

// Specific service hooks
export { default as useAuthService } from './useAuthService';
export { default as useGameService } from './useGameService';
export { default as useUserService } from './useUserService';
export { default as useAudioService } from './useAudioService';
export { default as useAnalyticsService } from './useAnalyticsService';
export { default as useLocalStorageService } from './useLocalStorageService';

// Convenience provider hook
export { default as useServiceProvider } from './useServiceProvider';