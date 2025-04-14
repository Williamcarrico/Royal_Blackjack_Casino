/**
 * Base service interface for the application
 * This module defines the core service architecture used throughout the application.
 * It provides interfaces, error types, and base implementations for services.
 * @module ServiceInterface
 */

/**
 * Configuration options for services
 * @interface ServiceOptions
 * @property {number} [retryAttempts=3] - Number of retry attempts for failed operations
 * @property {number} [retryDelay=1000] - Delay in milliseconds between retry attempts
 * @property {number} [timeout=10000] - Timeout in milliseconds for operations
 * @property {boolean} [enableLogging=false] - Whether to enable logging for the service
 */
export interface ServiceOptions {
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    enableLogging?: boolean;
}

/**
 * Core interface that all services must implement
 * @interface ServiceInterface
 */
export interface ServiceInterface {
    /**
     * Initialize the service
     * This must be called before using any service methods
     * @returns {Promise<void>} A promise that resolves when initialization is complete
     */
    initialize(): Promise<void>;

    /**
     * Check if the service has been initialized
     * @returns {boolean} True if the service is initialized, false otherwise
     */
    isInitialized(): boolean;

    /**
     * Reset the service to its initial state
     * This can be used to clean up resources or reset state
     * @returns {Promise<void>} A promise that resolves when reset is complete
     */
    reset(): Promise<void>;
}

/**
 * Base error class for service-related errors
 * @class ServiceError
 * @extends Error
 */
export class ServiceError extends Error {
    /**
     * Error code that identifies the type of error
     */
    public code: string;

    /**
     * Additional details about the error
     */
    public details?: Record<string, unknown>;

    /**
     * Create a new ServiceError
     * @param {string} message - Error message
     * @param {string} code - Error code
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.details = details;
    }
}

/**
 * Error thrown when a network operation fails
 * @class NetworkError
 * @extends ServiceError
 */
export class NetworkError extends ServiceError {
    /**
     * HTTP status code if available
     */
    public statusCode?: number;

    /**
     * Create a new NetworkError
     * @param {string} message - Error message
     * @param {number} [statusCode] - HTTP status code
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
        super(message, 'NETWORK_ERROR', details);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }
}

/**
 * Error thrown when an authentication operation fails
 * @class AuthenticationError
 * @extends ServiceError
 */
export class AuthenticationError extends ServiceError {
    /**
     * Create a new AuthenticationError
     * @param {string} message - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'AUTHENTICATION_ERROR', details);
        this.name = 'AuthenticationError';
    }
}

/**
 * Error thrown when validation fails
 * @class ValidationError
 * @extends ServiceError
 */
export class ValidationError extends ServiceError {
    /**
     * Create a new ValidationError
     * @param {string} message - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Error thrown when a resource is not found
 * @class NotFoundError
 * @extends ServiceError
 */
export class NotFoundError extends ServiceError {
    /**
     * Create a new NotFoundError
     * @param {string} message - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'NOT_FOUND_ERROR', details);
        this.name = 'NotFoundError';
    }
}

/**
 * Error thrown when an operation times out
 * @class TimeoutError
 * @extends ServiceError
 */
export class TimeoutError extends ServiceError {
    /**
     * Create a new TimeoutError
     * @param {string} message - Error message
     * @param {Record<string, unknown>} [details] - Additional error details
     */
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'TIMEOUT_ERROR', details);
        this.name = 'TimeoutError';
    }
}

/**
 * Base implementation of a service
 * Provides common functionality for all services
 * @abstract
 * @class BaseService
 * @implements {ServiceInterface}
 */
export abstract class BaseService implements ServiceInterface {
    /**
     * Whether the service has been initialized
     * @protected
     */
    protected initialized: boolean = false;

    /**
     * Service configuration options
     * @protected
     */
    protected options: ServiceOptions;

    /**
     * Create a new BaseService
     * @param {ServiceOptions} [options={}] - Service configuration options
     */
    constructor(options: ServiceOptions = {}) {
        this.options = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
            enableLogging: false,
            ...options
        };
    }

    /**
     * Initialize the service
     * This method handles common initialization logic and delegates to initializeImpl
     * @public
     * @returns {Promise<void>} A promise that resolves when initialization is complete
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.initializeImpl();
            this.initialized = true;
        } catch (error) {
            this.logError('Service initialization failed', error);
            throw error;
        }
    }

    /**
     * Check if the service has been initialized
     * @public
     * @returns {boolean} True if the service is initialized, false otherwise
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Reset the service to its initial state
     * This method handles common reset logic and delegates to resetImpl
     * @public
     * @returns {Promise<void>} A promise that resolves when reset is complete
     */
    public async reset(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        try {
            await this.resetImpl();
            this.initialized = false;
        } catch (error) {
            this.logError('Service reset failed', error);
            throw error;
        }
    }

    /**
     * Implementation of service initialization
     * This must be implemented by derived classes
     * @protected
     * @abstract
     * @returns {Promise<void>} A promise that resolves when initialization is complete
     */
    protected abstract initializeImpl(): Promise<void>;

    /**
     * Implementation of service reset
     * This can be overridden by derived classes
     * @protected
     * @returns {Promise<void>} A promise that resolves when reset is complete
     */
    protected async resetImpl(): Promise<void> {
        // Default implementation - can be overridden
    }

    /**
     * Execute an operation with automatic retry on failure
     * @protected
     * @template T
     * @param {() => Promise<T>} operation - The operation to execute
     * @param {number} [retryAttempts=this.options.retryAttempts] - Number of retry attempts
     * @param {number} [retryDelay=this.options.retryDelay] - Delay between retry attempts
     * @returns {Promise<T>} A promise that resolves with the operation result
     * @throws {Error} If the operation fails after all retry attempts
     */
    protected async withRetry<T>(
        operation: () => Promise<T>,
        retryAttempts = this.options.retryAttempts,
        retryDelay = this.options.retryDelay
    ): Promise<T> {
        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= (retryAttempts ?? 0); attempt++) {
            try {
                return await this.withTimeout(operation);
            } catch (error) {
                if (error instanceof Error) {
                    lastError = error;

                    // Don't retry auth errors, validation errors or not found errors
                    if (
                        error instanceof AuthenticationError ||
                        error instanceof ValidationError ||
                        error instanceof NotFoundError
                    ) {
                        throw error;
                    }

                    if (attempt < (retryAttempts ?? 0)) {
                        const delay = (retryDelay ?? 1000) * Math.pow(2, attempt);
                        this.log(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${retryAttempts})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    throw error;
                }
            }
        }

        throw lastError || new Error('Operation failed after retries');
    }

    /**
     * Execute an operation with a timeout
     * @protected
     * @template T
     * @param {() => Promise<T>} operation - The operation to execute
     * @returns {Promise<T>} A promise that resolves with the operation result
     * @throws {TimeoutError} If the operation times out
     */
    protected async withTimeout<T>(operation: () => Promise<T>): Promise<T> {
        const timeout = this.options.timeout ?? 10000;

        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new TimeoutError(`Operation timed out after ${timeout}ms`));
            }, timeout);

            operation()
                .then(result => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }

    /**
     * Log a message if logging is enabled
     * @protected
     * @param {string} message - The message to log
     * @param {unknown} [data] - Additional data to log
     */
    protected log(message: string, data?: unknown): void {
        if (this.options.enableLogging) {
            console.log(`[${this.constructor.name}]`, message, data ? data : '');
        }
    }

    /**
     * Log an error message if logging is enabled
     * @protected
     * @param {string} message - The error message to log
     * @param {unknown} [error] - The error object to log
     */
    protected logError(message: string, error?: unknown): void {
        if (this.options.enableLogging) {
            console.error(`[${this.constructor.name}]`, message, error ? error : '');
        }
    }
}