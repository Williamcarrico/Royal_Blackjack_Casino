import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values, merges Tailwind classes to avoid conflicts
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Creates a style object for cases where dynamic inline styles are necessary
 * but we want to minimize their usage
 */
export function createDynamicStyle(styleObj: Record<string, string | number>) {
    return styleObj;
}