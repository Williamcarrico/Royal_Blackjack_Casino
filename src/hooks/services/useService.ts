/**
 * React hook for using services within components
 */
import { useEffect, useState, useCallback } from 'react';
import ServiceManager from '../../services/serviceRegistry';
import { BaseService, ServiceError } from '../../services/serviceInterface';

// Define the service types by name
export type ServiceName =
    | 'auth'
    | 'game'
    | 'user'
    | 'stats'
    | 'localStorage'
    | 'indexedDB'
    | 'audio'
    | 'eventTracker';

/**
 * Hook for using a service within a React component
 *
 * @param serviceName The name of the service to use
 * @param autoInitialize Whether to initialize the service automatically
 * @returns An object containing the service, loading state, and error
 */
export function useService<T extends BaseService>(
    serviceName: ServiceName,
    autoInitialize = true
): {
    service: T | null;
    isLoading: boolean;
    error: ServiceError | null;
    initialize: () => Promise<void>;
    reset: () => Promise<void>;
} {
    const [service, setService] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(autoInitialize);
    const [error, setError] = useState<ServiceError | null>(null);

    const initialize = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const serviceManager = ServiceManager.getInstance();
            const serviceInstance = await serviceManager.getService<T>(serviceName);

            setService(serviceInstance);
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);

            if (err instanceof ServiceError) {
                setError(err);
            } else {
                setError(new ServiceError(
                    `Failed to initialize service ${serviceName}`,
                    'initialization_failed',
                    err
                ));
            }
        }
    }, [serviceName]);

    const reset = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const serviceManager = ServiceManager.getInstance();
            await serviceManager.resetService(serviceName);

            setService(null);
            setIsLoading(false);
        } catch (err) {
            setIsLoading(false);

            if (err instanceof ServiceError) {
                setError(err);
            } else {
                setError(new ServiceError(
                    `Failed to reset service ${serviceName}`,
                    'reset_failed',
                    err
                ));
            }
        }
    }, [serviceName]);

    // Initialize the service if autoInitialize is true
    useEffect(() => {
        if (autoInitialize) {
            initialize();
        }
    }, [autoInitialize, initialize]);

    return { service, isLoading, error, initialize, reset };
}

/**
 * Hook for checking if a service is available without initializing it
 *
 * @param serviceName The name of the service to check
 * @returns Whether the service is registered and initialized
 */
export function useServiceAvailability(serviceName: ServiceName): {
    isRegistered: boolean;
    isInitialized: boolean;
} {
    const [isRegistered, setIsRegistered] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    useEffect(() => {
        const serviceManager = ServiceManager.getInstance();
        const registeredServices = serviceManager.getRegisteredServices();

        setIsRegistered(registeredServices.includes(serviceName));
        setIsInitialized(serviceManager.isInitialized(serviceName));
    }, [serviceName]);

    return { isRegistered, isInitialized };
}

/**
 * Hook for getting a service lazily (only when needed)
 *
 * @param serviceName The name of the service to use
 * @returns A function that returns a promise resolving to the service
 */
export function useLazyService<T extends BaseService>(
    serviceName: ServiceName
): {
    getService: () => Promise<T>;
    resetService: () => Promise<void>;
    isInitialized: boolean;
} {
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const getService = useCallback(async (): Promise<T> => {
        try {
            const serviceManager = ServiceManager.getInstance();
            const service = await serviceManager.getService<T>(serviceName);

            setIsInitialized(true);
            return service;
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err;
            }

            throw new ServiceError(
                `Failed to get service ${serviceName}`,
                'service_access_failed',
                err
            );
        }
    }, [serviceName]);

    const resetService = useCallback(async (): Promise<void> => {
        try {
            const serviceManager = ServiceManager.getInstance();
            await serviceManager.resetService(serviceName);

            setIsInitialized(false);
        } catch (err) {
            if (err instanceof ServiceError) {
                throw err;
            }

            throw new ServiceError(
                `Failed to reset service ${serviceName}`,
                'reset_failed',
                err
            );
        }
    }, [serviceName]);

    // Check if the service is already initialized
    useEffect(() => {
        const serviceManager = ServiceManager.getInstance();
        setIsInitialized(serviceManager.isInitialized(serviceName));
    }, [serviceName]);

    return { getService, resetService, isInitialized };
}

/**
 * Type-checking helper for accessing a specific service type
 */
export function getTypedService<T extends BaseService>(service: BaseService | null): T | null {
    return service as T | null;
}

export default useService;