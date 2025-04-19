/**
 * Base interface for service options
 */
export interface ServiceOptions {
    debug?: boolean;
}

/**
 * Base class for services that need initialization and reset functionality
 */
export abstract class BaseService {
    protected initialized: boolean = false;
    protected readonly debug: boolean;

    constructor(options: ServiceOptions = {}) {
        this.debug = options.debug || false;
    }

    /**
     * Initialize the service
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.initializeImpl();
        this.initialized = true;
    }

    /**
     * Reset the service to its initial state
     */
    public async reset(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        await this.resetImpl();
        this.initialized = false;
    }

    /**
     * Check if the service is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Implementation of service initialization
     * To be implemented by derived classes
     */
    protected abstract initializeImpl(): Promise<void>;

    /**
     * Implementation of service reset
     * To be implemented by derived classes
     */
    protected abstract resetImpl(): Promise<void>;
}