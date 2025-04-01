import { useState, useEffect } from 'react';

interface ServiceStatus {
    isRegistered: boolean;
    isInitialized: boolean;
}

/**
 * Hook to check if a service is available and initialized
 * @param serviceName The name of the service to check
 * @returns Object containing registration and initialization status
 */
export function useServiceAvailability(serviceName: string): ServiceStatus {
    const [status, setStatus] = useState<ServiceStatus>({
        isRegistered: false,
        isInitialized: false
    });

    useEffect(() => {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            return;
        }

        let isRegistered = false;
        let isInitialized = false;

        // Check specific services
        switch (serviceName) {
            case 'localStorage':
                try {
                    // Test if localStorage is available
                    window.localStorage.setItem('service_test', 'test');
                    window.localStorage.removeItem('service_test');
                    isRegistered = true;
                    isInitialized = true;
                } catch (e) {
                    console.warn('localStorage is not available:', e);
                }
                break;

            case 'indexedDB':
                isRegistered = typeof window.indexedDB !== 'undefined';
                // For indexedDB, we consider it initialized if it's available
                isInitialized = isRegistered;
                break;

            case 'serviceWorker':
                isRegistered = 'serviceWorker' in navigator;
                // For serviceWorker, we consider it registered if available
                isInitialized = isRegistered;
                break;

            // Add more service checks as needed
            default:
                // For custom services, check the global registry if it exists
                if (window.__servicesRegistry?.[serviceName]) {
                    isRegistered = true;
                    isInitialized = window.__servicesRegistry[serviceName]?.initialized === true;
                }
                break;
        }

        setStatus({ isRegistered, isInitialized });
    }, [serviceName]);

    return status;
}

// Declare global type for service registry
declare global {
    interface Window {
        __servicesRegistry?: Record<string, { initialized: boolean }>;
    }
}