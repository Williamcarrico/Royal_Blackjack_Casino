/**
 * Service Registry for managing services and their dependencies
 *
 * This module implements a service registry pattern that manages the lifecycle
 * of all application services, their dependencies, and initialization order.
 *
 * @module ServiceRegistry
 */
import { BaseService, ServiceOptions, ServiceError } from './serviceInterface';

// Game services
import GameService from './api/gameService';
import AuthService from './api/authService';
import UserService from './api/userService';
import StatsService from './api/statsService';

// Storage services
import LocalStorageService from './storage/localStorageService';
import IndexedDBService from './storage/indexedDBService';

// Audio services
import AudioManager from './audio/audioManager';

// Analytics services
import EventTracker from './analytics/eventTracker';

/**
 * Interface for service classes that can be instantiated by the registry
 * @interface ServiceClassType
 */
interface ServiceClassType {
    /**
     * Get a singleton instance of the service
     * @param {ServiceOptions} [config] - Optional configuration for the service
     * @returns {BaseService} The service instance
     */
    getInstance(config?: ServiceOptions): BaseService;
}

/**
 * Type alias for service class
 */
type ServiceType = ServiceClassType;

/**
 * Type alias for service instance
 */
type ServiceInstance = BaseService;

/**
 * Type alias for service configuration
 */
type ServiceConfig = ServiceOptions;

/**
 * Registry mapping service names to their metadata
 * @interface ServiceRegistry
 */
interface ServiceRegistry {
    [key: string]: {
        /** The service class/constructor */
        service: ServiceType;
        /** The service instance (if created) */
        instance?: ServiceInstance;
        /** Service configuration options */
        config?: ServiceConfig;
        /** Names of other services this service depends on */
        dependencies?: string[];
    };
}

/**
 * Central manager for all application services
 *
 * Implements the Singleton pattern to ensure a single registry exists
 * for the application lifecycle.
 *
 * @class ServiceManager
 */
class ServiceManager {
    /** Singleton instance of the service manager */
    private static instance: ServiceManager;
    /** Registry containing all registered services */
    private registry: ServiceRegistry = {};
    /** Set of services that have been initialized */
    private readonly initializedServices: Set<string> = new Set();
    /** Set of services currently being initialized (used for cycle detection) */
    private initializationInProgress: Set<string> = new Set();

    /**
     * Private constructor to enforce singleton pattern
     * Registers all default services
     */
    private constructor() {
        // Register all services with their dependencies
        this.registerDefaultServices();
    }

    /**
     * Get the singleton instance of the service manager
     * @returns {ServiceManager} The service manager instance
     */
    public static getInstance(): ServiceManager {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }

    /**
     * Register a service with the registry
     *
     * @template T - Type of the service class
     * @param {string} name - Unique name for the service
     * @param {T} serviceClass - The service class to register
     * @param {ServiceConfig} [config] - Optional configuration for the service
     * @param {string[]} [dependencies] - Names of other services this service depends on
     */
    public register<T>(
        name: string,
        serviceClass: T,
        config?: ServiceConfig,
        dependencies?: string[]
    ): void {
        this.registry[name] = {
            service: serviceClass as ServiceType,
            config,
            dependencies,
        };
    }

    /**
     * Get a service instance, initializing it and its dependencies if needed
     *
     * @template T - Type of the service instance
     * @param {string} name - Name of the service to get
     * @returns {Promise<T>} Promise resolving to the service instance
     * @throws {ServiceError} If the service is not registered or if there's a circular dependency
     */
    public async getService<T extends ServiceInstance>(name: string): Promise<T> {
        // Check if the service is registered
        if (!this.registry[name]) {
            throw new ServiceError(
                `Service ${name} is not registered`,
                'service_not_found'
            );
        }

        // If the service is already initialized, return it
        if (this.initializedServices.has(name) && this.registry[name].instance) {
            return this.registry[name].instance as T;
        }

        // If the service is being initialized, wait for it
        if (this.initializationInProgress.has(name)) {
            throw new ServiceError(
                `Circular dependency detected while initializing ${name}`,
                'circular_dependency'
            );
        }

        // Initialize the service and its dependencies
        return this.initializeService<T>(name);
    }

    /**
     * Initialize all registered services
     *
     * @returns {Promise<void>} Promise that resolves when all services are initialized
     */
    public async initializeAll(): Promise<void> {
        const serviceNames = Object.keys(this.registry);

        for (const name of serviceNames) {
            if (!this.initializedServices.has(name)) {
                await this.initializeService(name);
            }
        }
    }

    /**
     * Reset a specific service to its initial state
     *
     * @param {string} name - Name of the service to reset
     * @returns {Promise<void>} Promise that resolves when the service is reset
     * @throws {ServiceError} If the service is not registered
     */
    public async resetService(name: string): Promise<void> {
        if (!this.registry[name]) {
            throw new ServiceError(
                `Service ${name} is not registered`,
                'service_not_found'
            );
        }

        if (this.initializedServices.has(name) && this.registry[name].instance) {
            await this.registry[name].instance.reset();
            this.initializedServices.delete(name);
            this.registry[name].instance = undefined;
        }
    }

    /**
     * Reset all initialized services
     *
     * @returns {Promise<void>} Promise that resolves when all services are reset
     */
    public async resetAll(): Promise<void> {
        const serviceNames = Array.from(this.initializedServices);

        for (const name of serviceNames) {
            await this.resetService(name);
        }
    }

    /**
     * Check if a service is initialized
     *
     * @param {string} name - Name of the service to check
     * @returns {boolean} True if the service is initialized, false otherwise
     */
    public isInitialized(name: string): boolean {
        return this.initializedServices.has(name);
    }

    /**
     * Get names of all registered services
     *
     * @returns {string[]} Array of service names
     */
    public getRegisteredServices(): string[] {
        return Object.keys(this.registry);
    }

    /**
     * Get names of all initialized services
     *
     * @returns {string[]} Array of initialized service names
     */
    public getInitializedServices(): string[] {
        return Array.from(this.initializedServices);
    }

    /**
     * Add or update configuration for a service
     * If the service is already initialized, it will be reset
     *
     * @param {string} name - Name of the service to configure
     * @param {ServiceConfig} config - Configuration to apply
     * @throws {ServiceError} If the service is not registered
     */
    public configure(name: string, config: ServiceConfig): void {
        if (!this.registry[name]) {
            throw new ServiceError(
                `Cannot configure service ${name}: not registered`,
                'service_not_found'
            );
        }

        // If the service is already initialized, reset it
        if (this.initializedServices.has(name)) {
            console.warn(`Service ${name} is already initialized, it will be reset`);
            this.resetService(name);
        }

        // Update the configuration
        this.registry[name].config = {
            ...this.registry[name].config,
            ...config
        };
    }

    /**
     * Initialize a service and its dependencies
     *
     * @private
     * @template T - Type of the service instance
     * @param {string} name - Name of the service to initialize
     * @returns {Promise<T>} Promise resolving to the initialized service
     * @throws {ServiceError} If initialization fails or there's a circular dependency
     */
    private async initializeService<T extends ServiceInstance>(name: string): Promise<T> {
        // Mark the service as being initialized
        this.initializationInProgress.add(name);

        try {
            if (!this.registry[name]) {
                throw new ServiceError(
                    `Service ${name} is not registered`,
                    'service_not_found'
                );
            }

            // Initialize dependencies first
            const dependencies = this.registry[name].dependencies || [];
            for (const dep of dependencies) {
                if (!this.initializedServices.has(dep)) {
                    await this.initializeService(dep);
                }
            }

            // Get the service class and config
            const { service, config } = this.registry[name];

            // Create an instance if it doesn't exist
            if (!this.registry[name].instance) {
                // Check for getInstance method
                if (typeof service.getInstance !== 'function') {
                    throw new ServiceError(
                        `Service ${name} does not have a getInstance method`,
                        'invalid_service'
                    );
                }

                // Create the instance
                this.registry[name].instance = service.getInstance(config);
            }

            // Initialize the service
            await this.registry[name].instance!.initialize();

            // Mark the service as initialized
            this.initializedServices.add(name);
            this.initializationInProgress.delete(name);

            return this.registry[name].instance as T;
        } catch (error) {
            // If there's an error, clean up
            this.initializationInProgress.delete(name);

            if (error instanceof ServiceError) {
                throw error;
            }

            throw new ServiceError(
                `Failed to initialize service ${name}: ${error}`,
                'initialization_failed',
                { originalError: error }
            );
        }
    }

    /**
     * Register all default services with their dependencies
     *
     * @private
     */
    private registerDefaultServices(): void {
        // Register API services
        this.register('auth', AuthService);
        this.register('game', GameService, {}, ['auth']);
        this.register('user', UserService, {}, ['auth']);
        this.register('stats', StatsService, {}, ['auth']);

        // Register storage services
        this.register('localStorage', LocalStorageService);
        this.register('indexedDB', IndexedDBService);

        // Register audio services
        this.register('audio', AudioManager, {}, ['localStorage']);

        // Register analytics services
        this.register('eventTracker', EventTracker);
    }
}

export default ServiceManager;