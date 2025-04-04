/**
 * Service Registry for managing services and their dependencies
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

// Define a more specific service class interface
interface ServiceClassType {
    getInstance(config?: ServiceOptions): BaseService;
}

type ServiceType = ServiceClassType;
type ServiceInstance = BaseService;
type ServiceConfig = ServiceOptions;

interface ServiceRegistry {
    [key: string]: {
        service: ServiceType;
        instance?: ServiceInstance;
        config?: ServiceConfig;
        dependencies?: string[];
    };
}

class ServiceManager {
    private static instance: ServiceManager;
    private registry: ServiceRegistry = {};
    private readonly initializedServices: Set<string> = new Set();
    private initializationInProgress: Set<string> = new Set();

    private constructor() {
        // Register all services with their dependencies
        this.registerDefaultServices();
    }

    public static getInstance(): ServiceManager {
        if (!ServiceManager.instance) {
            ServiceManager.instance = new ServiceManager();
        }
        return ServiceManager.instance;
    }

    /**
     * Register a service with the registry
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
     * Get a service instance, initializing it if needed
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
     * Reset a specific service
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
     * Reset all services
     */
    public async resetAll(): Promise<void> {
        const serviceNames = Array.from(this.initializedServices);

        for (const name of serviceNames) {
            await this.resetService(name);
        }
    }

    /**
     * Check if a service is initialized
     */
    public isInitialized(name: string): boolean {
        return this.initializedServices.has(name);
    }

    /**
     * Get names of all registered services
     */
    public getRegisteredServices(): string[] {
        return Object.keys(this.registry);
    }

    /**
     * Get names of all initialized services
     */
    public getInitializedServices(): string[] {
        return Array.from(this.initializedServices);
    }

    /**
     * Add a custom service configuration
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