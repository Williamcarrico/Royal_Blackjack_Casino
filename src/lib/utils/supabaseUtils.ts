/**
 * Supabase utility functions for error handling and query result formatting
 */
import { toast } from 'sonner'
import type { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js'

/**
 * Error result object type
 */
export interface ErrorResult {
    message: string;
    code: string | null;
    details?: unknown;
}

/**
 * Query result object type
 */
export interface QueryResult<T> {
    data: T | null;
    error: ErrorResult | null;
    success: boolean;
}

/**
 * Handles Supabase query errors with a consistent pattern
 *
 * @param error The error from Supabase query
 * @param fallbackMessage Fallback message if error doesn't have one
 * @param showToast Whether to show a toast notification
 * @returns The error object with structured format
 */
export const handleSupabaseError = (
    error: PostgrestError | null,
    fallbackMessage = 'An unexpected error occurred',
    showToast = true
): ErrorResult => {
    if (!error) {
        return { message: '', code: null }
    }

    const message = error.message || fallbackMessage
    const code = error.code
    const details = error.details

    if (showToast) {
        toast.error(message)
    }

    console.error('Supabase Error:', { message, code, details })
    return { message, code, details }
}

/**
 * Transforms Supabase query result into a standard format
 *
 * @param result The PostgrestResponse or PostgrestSingleResponse from Supabase
 * @param options Optional configuration for error handling
 * @returns A standardized result object
 */
export const formatQueryResult = <T>(
    result: PostgrestResponse<T> | PostgrestSingleResponse<T>,
    options?: {
        showToast?: boolean;
        fallbackMessage?: string;
    }
): QueryResult<T> => {
    const { data, error } = result
    const { showToast = true, fallbackMessage } = options || {}

    if (error) {
        const errorResult = handleSupabaseError(error, fallbackMessage, showToast)
        return {
            data: null,
            error: errorResult,
            success: false
        }
    }

    return {
        data,
        error: null,
        success: true
    }
}

/**
 * Creates a handler for a Supabase data fetch operation with standardized error handling
 *
 * @param operation Async function that performs a Supabase operation
 * @param options Optional configuration for error handling
 * @returns The result of the operation with standardized format
 */
export const withErrorHandling = async <T>(
    operation: () => Promise<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
    options?: {
        errorMessage?: string;
        showToast?: boolean;
    }
): Promise<QueryResult<T>> => {
    const { errorMessage = 'Failed to fetch data', showToast = true } = options || {}

    try {
        const result = await operation()
        return formatQueryResult(result, { showToast, fallbackMessage: errorMessage })
    } catch (err) {
        console.error('Error in Supabase operation:', err)

        if (showToast) {
            toast.error(errorMessage)
        }

        return {
            data: null,
            error: {
                message: err instanceof Error ? err.message : errorMessage,
                code: 'client_error'
            },
            success: false
        }
    }
}