/**
 * Hook for using the localStorage service with React
 */
import { useState, useEffect, useCallback } from 'react';
import { useService, getTypedService } from './useService';
import LocalStorageService from '../../services/storage/localStorageService';

export default function useLocalStorageService() {
    const {
        service: storageService,
        isLoading: serviceLoading,
        error: serviceError
    } = useService<LocalStorageService>('localStorage');

    const [isAvailable, setIsAvailable] = useState<boolean>(false);

    // Check if localStorage is available
    useEffect(() => {
        if (storageService && !serviceLoading) {
            setIsAvailable(storageService.isStorageAvailable());
        }
    }, [storageService, serviceLoading]);

    /**
     * Generic function to get an item from localStorage
     */
    const getItem = useCallback(<T>(
        key: string,
        defaultValue?: T
    ): T | null => {
        if (!storageService || !isAvailable) {
            return defaultValue || null;
        }

        return storageService.getItem<T>(key, defaultValue);
    }, [storageService, isAvailable]);

    /**
     * Generic function to set an item in localStorage
     */
    const setItem = useCallback(<T>(
        key: string,
        value: T,
        ttl?: number
    ): boolean => {
        if (!storageService || !isAvailable) {
            return false;
        }

        return storageService.setItem(key, value, ttl);
    }, [storageService, isAvailable]);

    /**
     * Remove an item from localStorage
     */
    const removeItem = useCallback((key: string): boolean => {
        if (!storageService || !isAvailable) {
            return false;
        }

        return storageService.removeItem(key);
    }, [storageService, isAvailable]);

    /**
     * Clear all items from localStorage
     */
    const clearAll = useCallback((): boolean => {
        if (!storageService || !isAvailable) {
            return false;
        }

        return storageService.clearAll();
    }, [storageService, isAvailable]);

    /**
     * Check if an item exists in localStorage
     */
    const hasItem = useCallback((key: string): boolean => {
        if (!storageService || !isAvailable) {
            return false;
        }

        return storageService.hasItem(key);
    }, [storageService, isAvailable]);

    /**
     * Get all keys in localStorage
     */
    const getAllKeys = useCallback((): string[] => {
        if (!storageService || !isAvailable) {
            return [];
        }

        return storageService.getAllKeys();
    }, [storageService, isAvailable]);

    /**
     * Update the expiration time of an item
     */
    const updateExpiration = useCallback((
        key: string,
        ttl: number
    ): boolean => {
        if (!storageService || !isAvailable) {
            return false;
        }

        return storageService.updateExpiration(key, ttl);
    }, [storageService, isAvailable]);

    /**
     * Get the total size of localStorage
     */
    const getTotalSize = useCallback((): number => {
        if (!storageService || !isAvailable) {
            return 0;
        }

        return storageService.getTotalSize();
    }, [storageService, isAvailable]);

    /**
     * Get the available space in localStorage
     */
    const getAvailableSpace = useCallback((): number => {
        if (!storageService || !isAvailable) {
            return 0;
        }

        return storageService.getAvailableSpace();
    }, [storageService, isAvailable]);

    /**
     * Clean expired items from localStorage
     */
    const cleanExpired = useCallback((): void => {
        if (!storageService || !isAvailable) {
            return;
        }

        storageService.cleanExpired();
    }, [storageService, isAvailable]);

    // Specialized hooks for common data types

    /**
     * Get a string from localStorage
     */
    const getString = useCallback((
        key: string,
        defaultValue: string = ''
    ): string => {
        return getItem<string>(key, defaultValue) || defaultValue;
    }, [getItem]);

    /**
     * Get a number from localStorage
     */
    const getNumber = useCallback((
        key: string,
        defaultValue: number = 0
    ): number => {
        const value = getItem<number>(key, defaultValue);
        return value !== null ? value : defaultValue;
    }, [getItem]);

    /**
     * Get a boolean from localStorage
     */
    const getBoolean = useCallback((
        key: string,
        defaultValue: boolean = false
    ): boolean => {
        const value = getItem<boolean>(key, defaultValue);
        return value !== null ? value : defaultValue;
    }, [getItem]);

    /**
     * Get an object from localStorage
     */
    const getObject = useCallback(<T extends object>(
        key: string,
        defaultValue?: T
    ): T | null => {
        return getItem<T>(key, defaultValue);
    }, [getItem]);

    /**
     * Get an array from localStorage
     */
    const getArray = useCallback(<T>(
        key: string,
        defaultValue: T[] = []
    ): T[] => {
        return getItem<T[]>(key, defaultValue) || defaultValue;
    }, [getItem]);

    return {
        service: getTypedService<LocalStorageService>(storageService),
        isLoading: serviceLoading,
        error: serviceError,
        isAvailable,

        // Generic methods
        getItem,
        setItem,
        removeItem,
        clearAll,
        hasItem,
        getAllKeys,
        updateExpiration,
        getTotalSize,
        getAvailableSpace,
        cleanExpired,

        // Specialized methods
        getString,
        getNumber,
        getBoolean,
        getObject,
        getArray
    };
}