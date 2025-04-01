'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { setupServices } from '../utils/serviceInit';
import { useServiceAvailability } from '../hooks/services/useServiceAvailability';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from 'next-themes';
import { useGameStoreInitializer } from "@/lib/hooks/useGameStoreInitializer";

// Create a context for the service initialization status
type ServiceContextType = {
    isInitialized: boolean;
    isInitializing: boolean;
    error: Error | null;
};

const ServiceContext = React.createContext<ServiceContextType>({
    isInitialized: false,
    isInitializing: true,
    error: null
});

export const useServiceContext = () => React.useContext(ServiceContext);

interface ProvidersProps {
    readonly children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
    const [isInitializing, setIsInitializing] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const pathname = usePathname();

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = React.useMemo(() => ({
        isInitialized,
        isInitializing,
        error
    }), [isInitialized, isInitializing, error]);

    // Check if localStorage is available (used for service initialization check)
    const { isRegistered: isLocalStorageRegistered, isInitialized: isLocalStorageInitialized } =
        useServiceAvailability('localStorage');

    // Add debugging info
    useEffect(() => {
        if (typeof window !== 'undefined') {
            console.log('Service initialization status:', {
                isLocalStorageRegistered,
                isLocalStorageInitialized,
                isInitializing,
                isInitialized
            });
        }
    }, [isLocalStorageRegistered, isLocalStorageInitialized, isInitializing, isInitialized]);

    // Initialize services on mount
    useEffect(() => {
        const initializeAppServices = async () => {
            try {
                setIsInitializing(true);
                console.log('Starting service initialization...');

                // Setup default service configurations
                const serviceConfigs = {
                    localStorage: {
                        namespace: 'blackjack_app',
                        storageType: 'localStorage'
                    },
                    eventTracker: {
                        endpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
                        batchSize: 20,
                        flushInterval: 30000,
                        debugMode: process.env.NODE_ENV === 'development'
                    },
                    audio: {
                        defaultVolume: 0.7,
                        musicVolume: 0.5,
                        soundVolume: 0.8
                    },
                    auth: {
                        enabled: true
                    },
                    game: {
                        defaultDifficulty: 'normal'
                    },
                    user: {
                        guestMode: true
                    },
                    stats: {
                        trackWinRate: true
                    },
                    indexedDB: {
                        name: 'blackjack_storage',
                        version: 1
                    }
                };

                // Initialize services
                await setupServices(serviceConfigs);
                console.log('Services initialized successfully');

                setIsInitialized(true);
                setError(null);
            } catch (err) {
                console.error('Failed to initialize services:', err);
                setError(err instanceof Error ? err : new Error('Failed to initialize services'));
                // Force initialization to complete even if there's an error
                setIsInitialized(true);
            } finally {
                setIsInitializing(false);
            }
        };

        initializeAppServices();
    }, []);

    // Effect to track page views
    useEffect(() => {
        // Import dynamically to avoid server-side execution
        if (typeof window !== 'undefined' && isInitialized) {
            import('../services/analytics').then(({ analyticsService }) => {
                const trackPageView = async () => {
                    try {
                        // Track the page view manually
                        if (pathname && analyticsService) {
                            analyticsService.trackPageView(pathname);
                        }
                    } catch (err) {
                        console.error('Failed to track page view:', err);
                    }
                };

                trackPageView();
            }).catch(err => {
                console.error('Failed to import analytics service:', err);
            });
        }
    }, [pathname, isInitialized]);

    // Initialize game store with event listeners
    useGameStoreInitializer();

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={true}
        >
            <ServiceContext.Provider value={contextValue}>
                {/* Modified condition to ensure we don't get stuck on loading screen */}
                {(isLocalStorageRegistered && isLocalStorageInitialized) || !isInitializing ? (
                    <>
                        {children}
                        {/* Global toast notifications */}
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                className: '',
                                duration: 5000,
                                style: {
                                    background: '#363636',
                                    color: '#fff',
                                },
                            }}
                        />
                    </>
                ) : (
                    <div className="flex items-center justify-center w-full h-screen bg-background">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
                            <p className="text-muted-foreground">Initializing application</p>
                            {error && (
                                <p className="mt-2 text-sm text-red-500">
                                    Error: {error.message}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </ServiceContext.Provider>
        </ThemeProvider>
    );
}