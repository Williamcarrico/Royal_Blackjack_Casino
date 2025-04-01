/**
 * Base service interface for the application
 */

export interface ServiceOptions {
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    enableLogging?: boolean;
}

export interface ServiceInterface {
    initialize(): Promise<void>;
    isInitialized(): boolean;
    reset(): Promise<void>;
}

export class ServiceError extends Error {
    public code: string;
    public details?: Record<string, unknown>;

    constructor(message: string, code: string, details?: Record<string, unknown>) {
        super(message);
        this.name = 'ServiceError';
        this.code = code;
        this.details = details;
    }
}

export class NetworkError extends ServiceError {
    public statusCode?: number;

    constructor(message: string, statusCode?: number, details?: Record<string, unknown>) {
        super(message, 'NETWORK_ERROR', details);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }
}

export class AuthenticationError extends ServiceError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'AUTHENTICATION_ERROR', details);
        this.name = 'AuthenticationError';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends ServiceError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'NOT_FOUND_ERROR', details);
        this.name = 'NotFoundError';
    }
}

export class TimeoutError extends ServiceError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'TIMEOUT_ERROR', details);
        this.name = 'TimeoutError';
    }
}

export abstract class BaseService implements ServiceInterface {
    protected initialized: boolean = false;
    protected options: ServiceOptions;

    constructor(options: ServiceOptions = {}) {
        this.options = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
            enableLogging: false,
            ...options
        };
    }

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

    public isInitialized(): boolean {
        return this.initialized;
    }

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

    protected abstract initializeImpl(): Promise<void>;

    protected async resetImpl(): Promise<void> {
        // Default implementation - can be overridden
    }

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

    protected log(message: string, data?: unknown): void {
        if (this.options.enableLogging) {
            console.log(`[${this.constructor.name}]`, message, data ? data : '');
        }
    }

    protected logError(message: string, error?: unknown): void {
        if (this.options.enableLogging) {
            console.error(`[${this.constructor.name}]`, message, error ? error : '');
        }
    }
}