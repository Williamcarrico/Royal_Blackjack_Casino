/**
 * Local Storage service for persistent client-side storage
 */
import { BaseService, ServiceOptions } from '../serviceInterface';

export interface StorageOptions {
    namespace?: string;
    expirationKey?: string;
}

export interface StorageItem<T> {
    value: T;
    expires?: number;
}

export interface LocalStorageServiceConfig extends ServiceOptions, StorageOptions { }

class LocalStorageService extends BaseService {
    private static instance: LocalStorageService;
    private namespace: string;
    private expirationKey: string;
    private isStorageAvailable: boolean;

    private constructor(config: LocalStorageServiceConfig = {}) {
        super(config);

        this.namespace = config.namespace || 'blackjack_';
        this.expirationKey = config.expirationKey || '_expires';
        this.isStorageAvailable = this.checkStorageAvailability();
    }

    public static getInstance(config?: LocalStorageServiceConfig): LocalStorageService {
        if (!LocalStorageService.instance) {
            LocalStorageService.instance = new LocalStorageService(config);
        }
        return LocalStorageService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
        } else {
            this.log('LocalStorage service initialized');
        }
    }

    protected async resetImpl(): Promise<void> {
        this.clearAll();
        this.log('LocalStorage service reset');
    }

    /**
     * Set an item in the localStorage
     */
    public setItem<T>(key: string, value: T, ttl?: number): boolean {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return false;
        }

        try {
            const item: StorageItem<T> = { value };

            // Set expiration if ttl is provided
            if (ttl && ttl > 0) {
                item.expires = Date.now() + ttl;
            }

            const fullKey = this.getNamespacedKey(key);
            localStorage.setItem(fullKey, JSON.stringify(item));

            return true;
        } catch (error) {
            this.logError(`Failed to set item ${key}`, error);
            return false;
        }
    }

    /**
     * Get an item from localStorage
     */
    public getItem<T>(key: string, defaultValue?: T): T | null {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return defaultValue || null;
        }

        try {
            const fullKey = this.getNamespacedKey(key);
            const serializedItem = localStorage.getItem(fullKey);

            if (!serializedItem) {
                return defaultValue || null;
            }

            const item: StorageItem<T> = JSON.parse(serializedItem);

            // Check if the item has expired
            if (item.expires && item.expires < Date.now()) {
                // Remove the expired item
                localStorage.removeItem(fullKey);
                return defaultValue || null;
            }

            return item.value;
        } catch (error) {
            this.logError(`Failed to get item ${key}`, error);
            return defaultValue || null;
        }
    }

    /**
     * Remove an item from localStorage
     */
    public removeItem(key: string): boolean {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return false;
        }

        try {
            const fullKey = this.getNamespacedKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            this.logError(`Failed to remove item ${key}`, error);
            return false;
        }
    }

    /**
     * Clear all items with the current namespace
     */
    public clearAll(): boolean {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return false;
        }

        try {
            // Get all keys that start with the namespace
            const keysToRemove: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key && key.startsWith(this.namespace)) {
                    keysToRemove.push(key);
                }
            }

            // Remove all keys
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });

            return true;
        } catch (error) {
            this.logError('Failed to clear all items', error);
            return false;
        }
    }

    /**
     * Update the expiration of an item
     */
    public updateExpiration(key: string, ttl: number): boolean {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return false;
        }

        try {
            const fullKey = this.getNamespacedKey(key);
            const serializedItem = localStorage.getItem(fullKey);

            if (!serializedItem) {
                return false;
            }

            const item = JSON.parse(serializedItem);
            item.expires = Date.now() + ttl;

            localStorage.setItem(fullKey, JSON.stringify(item));

            return true;
        } catch (error) {
            this.logError(`Failed to update expiration for ${key}`, error);
            return false;
        }
    }

    /**
     * Get all keys with the current namespace
     */
    public getAllKeys(): string[] {
        if (!this.isStorageAvailable) {
            this.logError('LocalStorage is not available');
            return [];
        }

        try {
            const keys: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key && key.startsWith(this.namespace)) {
                    // Remove the namespace from the key
                    keys.push(key.substring(this.namespace.length));
                }
            }

            return keys;
        } catch (error) {
            this.logError('Failed to get all keys', error);
            return [];
        }
    }

    /**
     * Check if localStorage has an item
     */
    public hasItem(key: string): boolean {
        if (!this.isStorageAvailable) {
            return false;
        }

        try {
            const fullKey = this.getNamespacedKey(key);
            const serializedItem = localStorage.getItem(fullKey);

            if (!serializedItem) {
                return false;
            }

            const item = JSON.parse(serializedItem);

            // Check if the item has expired
            if (item.expires && item.expires < Date.now()) {
                localStorage.removeItem(fullKey);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get the total size used by localStorage (in bytes)
     */
    public getTotalSize(): number {
        if (!this.isStorageAvailable) {
            return 0;
        }

        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key) {
                const value = localStorage.getItem(key) || '';
                totalSize += key.length + value.length;
            }
        }

        return totalSize * 2; // UTF-16 uses 2 bytes per character
    }

    /**
     * Get the available space for localStorage (approximate)
     */
    public getAvailableSpace(): number {
        if (!this.isStorageAvailable) {
            return 0;
        }

        // Try to estimate available space by adding data until we get an error
        const key = '__test_storage_space__';
        const testString = 'a'.repeat(1024); // 1KB string
        let testCount = 0;

        try {
            // Save current state
            const currentUsage = this.getTotalSize();
            const testData: string[] = [];

            // Add data until error
            while (true) {
                const testKey = `${key}_${testCount}`;
                localStorage.setItem(testKey, testString);
                testData.push(testKey);
                testCount++;

                // Safety check to avoid browser freeze (limit to 10MB)
                if (testCount > 10240) {
                    break;
                }
            }
        } catch (e) {
            // Clean up test data
            for (let i = 0; i < testCount; i++) {
                localStorage.removeItem(`${key}_${i}`);
            }

            // Calculate approximate available space
            return testCount * 1024;
        }

        // If we didn't hit an error, clean up and return a large value
        for (let i = 0; i < testCount; i++) {
            localStorage.removeItem(`${key}_${i}`);
        }

        return 10 * 1024 * 1024; // 10MB (default quota for most browsers)
    }

    /**
     * Clean up expired items
     */
    public cleanExpired(): void {
        if (!this.isStorageAvailable) {
            return;
        }

        try {
            const now = Date.now();
            const keysToCheck: string[] = [];

            // Collect all keys that might have expiration
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key && key.startsWith(this.namespace)) {
                    keysToCheck.push(key);
                }
            }

            // Check each key for expiration
            keysToCheck.forEach(key => {
                const serializedItem = localStorage.getItem(key);

                if (serializedItem) {
                    try {
                        const item = JSON.parse(serializedItem);

                        if (item.expires && item.expires < now) {
                            localStorage.removeItem(key);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            });
        } catch (error) {
            this.logError('Failed to clean expired items', error);
        }
    }

    private getNamespacedKey(key: string): string {
        return `${this.namespace}${key}`;
    }

    private checkStorageAvailability(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default LocalStorageService;