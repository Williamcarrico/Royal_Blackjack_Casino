/**
 * HTTP client utility for making API requests
 */
import { AuthenticationError, NetworkError, ServiceError, ValidationError } from './serviceInterface';
import { ApiResponse, ErrorResponse, SuccessResponse } from '../types/apiTypes';

export interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    timeout?: number;
    withCredentials?: boolean;
    signal?: AbortSignal;
}

export interface HttpClientConfig {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
    authTokenProvider?: () => Promise<string | null>;
    timeout?: number;
    responseInterceptor?: <T>(response: Response, data: any) => Promise<T>;
}

class HttpClient {
    private static instance: HttpClient;
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private authTokenProvider?: () => Promise<string | null>;
    private timeout: number;
    private responseInterceptor?: <T>(response: Response, data: any) => Promise<T>;

    private constructor(config: HttpClientConfig) {
        this.baseUrl = config.baseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...config.defaultHeaders
        };
        this.authTokenProvider = config.authTokenProvider;
        this.timeout = config.timeout || 10000;
        this.responseInterceptor = config.responseInterceptor;
    }

    public static getInstance(config?: HttpClientConfig): HttpClient {
        if (!HttpClient.instance && config) {
            HttpClient.instance = new HttpClient(config);
        } else if (!HttpClient.instance) {
            throw new Error('HttpClient must be initialized with a configuration');
        }
        return HttpClient.instance;
    }

    public static resetInstance(): void {
        HttpClient.instance = undefined as any;
    }

    public async get<T>(
        url: string,
        options: RequestOptions = {}
    ): Promise<T> {
        return this.request<T>('GET', url, undefined, options);
    }

    public async post<T>(
        url: string,
        data?: any,
        options: RequestOptions = {}
    ): Promise<T> {
        return this.request<T>('POST', url, data, options);
    }

    public async put<T>(
        url: string,
        data?: any,
        options: RequestOptions = {}
    ): Promise<T> {
        return this.request<T>('PUT', url, data, options);
    }

    public async patch<T>(
        url: string,
        data?: any,
        options: RequestOptions = {}
    ): Promise<T> {
        return this.request<T>('PATCH', url, data, options);
    }

    public async delete<T>(
        url: string,
        options: RequestOptions = {}
    ): Promise<T> {
        return this.request<T>('DELETE', url, undefined, options);
    }

    private async request<T>(
        method: string,
        url: string,
        data?: any,
        options: RequestOptions = {}
    ): Promise<T> {
        const fullUrl = this.buildUrl(url, options.params);
        const headers = await this.buildHeaders(options.headers);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeout);

        const signal = options.signal || controller.signal;

        try {
            const response = await fetch(fullUrl, {
                method,
                headers,
                body: data ? JSON.stringify(data) : undefined,
                credentials: options.withCredentials ? 'include' : 'same-origin',
                signal
            });

            clearTimeout(timeoutId);

            const responseData = await this.parseResponse(response);

            if (this.responseInterceptor) {
                return this.responseInterceptor<T>(response, responseData);
            }

            return responseData as T;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new NetworkError(`Request timeout after ${options.timeout || this.timeout}ms`, 408);
            }

            throw this.handleError(error);
        }
    }

    private buildUrl(url: string, params?: Record<string, string | number | boolean | undefined>): string {
        const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

        if (!params) {
            return fullUrl;
        }

        const searchParams = new URLSearchParams();

        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        }

        const queryString = searchParams.toString();

        if (queryString) {
            return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
        }

        return fullUrl;
    }

    private async buildHeaders(additionalHeaders?: Record<string, string>): Promise<Record<string, string>> {
        const headers = { ...this.defaultHeaders };

        if (this.authTokenProvider) {
            const token = await this.authTokenProvider();

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return {
            ...headers,
            ...additionalHeaders
        };
    }

    private async parseResponse(response: Response): Promise<any> {
        let data: any;
        const contentType = response.headers.get('Content-Type') || '';

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else if (contentType.includes('text/')) {
            data = await response.text();
        } else {
            data = await response.blob();
        }

        if (!response.ok) {
            this.handleErrorResponse(response.status, data);
        }

        return data;
    }

    private handleErrorResponse(status: number, data: any): never {
        const errorResponse = data as ErrorResponse;
        const message = errorResponse?.error?.message || 'Unknown error occurred';

        switch (status) {
            case 400:
                throw new ValidationError(message, errorResponse?.error?.details);
            case 401:
            case 403:
                throw new AuthenticationError(message, errorResponse?.error?.details);
            case 404:
                throw new ValidationError(`Resource not found: ${message}`, errorResponse?.error?.details);
            case 500:
            case 502:
            case 503:
            case 504:
                throw new NetworkError(`Server error: ${message}`, status, errorResponse?.error?.details);
            default:
                throw new ServiceError(message, errorResponse?.error?.code || 'UNKNOWN_ERROR', errorResponse?.error?.details);
        }
    }

    private handleError(error: unknown): Error {
        if (error instanceof Error) {
            return new NetworkError(
                `Network request failed: ${error.message}`,
                undefined,
                { originalError: error.message }
            );
        }

        return new ServiceError(
            'An unknown error occurred',
            'UNKNOWN_ERROR',
            { originalError: String(error) }
        );
    }
}

export default HttpClient;