/**
 * Utility for initializing services in the application
 */
import ServiceManager from '../services/serviceRegistry';
import { ServiceName } from '../hooks/services/useService';

/**
 * Initialize the specified services
 *
 * @param services Array of services to initialize
 * @returns Promise that resolves when all services are initialized
 */
export async function initializeServices(services: ServiceName[]): Promise<void> {
    const serviceManager = ServiceManager.getInstance();

    try {
        // For each service, check if it's already initialized
        for (const serviceName of services) {
            if (!serviceManager.isInitialized(serviceName)) {
                await serviceManager.getService(serviceName);
            }
        }
    } catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
}

/**
 * Initialize all registered services
 *
 * @returns Promise that resolves when all services are initialized
 */
export async function initializeAllServices(): Promise<void> {
    const serviceManager = ServiceManager.getInstance();

    try {
        await serviceManager.initializeAll();
    } catch (error) {
        console.error('Failed to initialize all services:', error);
        throw error;
    }
}

/**
 * Configure a service with custom options
 *
 * @param service Service to configure
 * @param options Configuration options
 */
export function configureService(service: ServiceName, options: any): void {
    const serviceManager = ServiceManager.getInstance();

    try {
        serviceManager.configure(service, options);
    } catch (error) {
        console.error(`Failed to configure service ${service}:`, error);
        throw error;
    }
}

/**
 * Reset a single service
 *
 * @param service Service to reset
 */
export async function resetService(service: ServiceName): Promise<void> {
    const serviceManager = ServiceManager.getInstance();

    try {
        await serviceManager.resetService(service);
    } catch (error) {
        console.error(`Failed to reset service ${service}:`, error);
        throw error;
    }
}

/**
 * Reset all initialized services
 */
export async function resetAllServices(): Promise<void> {
    const serviceManager = ServiceManager.getInstance();

    try {
        await serviceManager.resetAll();
    } catch (error) {
        console.error('Failed to reset all services:', error);
        throw error;
    }
}

/**
 * Get a list of registered services
 */
export function getRegisteredServices(): string[] {
    const serviceManager = ServiceManager.getInstance();
    return serviceManager.getRegisteredServices();
}

/**
 * Get a list of initialized services
 */
export function getInitializedServices(): string[] {
    const serviceManager = ServiceManager.getInstance();
    return serviceManager.getInitializedServices();
}

/**
 * Check if a service is initialized
 */
export function isServiceInitialized(service: ServiceName): boolean {
    const serviceManager = ServiceManager.getInstance();
    return serviceManager.isInitialized(service);
}

/**
 * Setup application services with standard configuration
 * This is typically called at application startup
 */
export async function setupServices(configs: Record<ServiceName, any> = {}): Promise<void> {
    // Configure services with provided configs
    if (Object.keys(configs).length > 0) {
        Object.entries(configs).forEach(([service, config]) => {
            configureService(service as ServiceName, config);
        });
    }

    // Always initialize these services at startup
    const coreServices: ServiceName[] = [
        'localStorage',
        'eventTracker'
    ];

    // Initialize core services
    await initializeServices(coreServices);

    // Return success
    return Promise.resolve();
}

const serviceUtils = {
    initializeServices,
    initializeAllServices,
    configureService,
    resetService,
    resetAllServices,
    getRegisteredServices,
    getInitializedServices,
    isServiceInitialized,
    setupServices
};

export default serviceUtils;