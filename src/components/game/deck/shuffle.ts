/**
 * Generic shuffling algorithms and utilities
 * Includes seeded randomness for reproducible shuffling
 */

/**
 * Simple seeded random number generator
 * Uses a Linear Congruential Generator algorithm
 */
class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Generates a random number between 0 (inclusive) and 1 (exclusive)
     * using the stored seed value
     */
    random(): number {
        // LCG parameters (from ANSI C)
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        // Update seed using LCG formula
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }

    /**
     * Generates a random integer between min (inclusive) and max (exclusive)
     */
    randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min) + min);
    }
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * This modifies the original array
 *
 * @param array The array to shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns The shuffled array (same reference)
 */
export const shuffleInPlace = <T>(array: T[], seed?: number): T[] => {
    // Create random generator - use seed if provided, otherwise use current timestamp
    const rng = seed !== undefined ? new SeededRandom(seed) : Math;

    // Fisher-Yates shuffle algorithm
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng.random() * (i + 1));
        [array[i], array[j]] = [array[j]!, array[i]!];
    }

    return array;
};

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * Creates a new copy without modifying the original
 *
 * @param array The array to shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns A new shuffled array
 */
export const shuffle = <T>(array: T[], seed?: number): T[] => {
    const newArray = [...array];
    return shuffleInPlace(newArray, seed);
};

/**
 * Performs a cut on an array
 *
 * @param array The array to cut
 * @param cutPosition The position to cut at (defaults to random)
 * @param seed Optional seed for reproducible cutting
 * @returns A new array that's been cut
 */
export const cutArray = <T>(array: T[], cutPosition?: number, seed?: number): T[] => {
    if (array.length <= 1) {
        return [...array];
    }

    // Create random generator if we need it
    const rng = (cutPosition === undefined && seed !== undefined) ? new SeededRandom(seed) : Math;

    // If no cut position specified, choose a random position
    // that's not too close to either end
    const actualCutPosition = cutPosition ?? Math.floor(array.length * 0.3 + rng.random() * array.length * 0.4);

    // Make sure the cut position is valid
    const validCutPosition = Math.max(1, Math.min(actualCutPosition, array.length - 1));

    // Cut the array
    const topHalf = array.slice(0, validCutPosition);
    const bottomHalf = array.slice(validCutPosition);

    // Return bottom half followed by top half
    return [...bottomHalf, ...topHalf];
};

/**
 * Overhand shuffle simulation - less random than Fisher-Yates but mimics real shuffling
 *
 * @param array The array to shuffle
 * @param iterations How many times to perform the shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns A new array of shuffled items
 */
export const overhandShuffle = <T>(array: T[], iterations = 3, seed?: number): T[] => {
    // Create random generator
    const rng = seed !== undefined ? new SeededRandom(seed) : Math;

    let result = [...array];

    for (let iter = 0; iter < iterations; iter++) {
        const shuffled: T[] = [];
        const remainingItems = [...result];

        // Continue until we've moved all items
        while (remainingItems.length > 0) {
            // Take a random small packet from the top
            const packetSize = Math.max(1, Math.floor(rng.random() * remainingItems.length * 0.4));
            const packet = remainingItems.splice(0, packetSize);

            // Add the packet to the beginning of the shuffled pile
            shuffled.unshift(...packet);
        }

        result = shuffled;
    }

    return result;
};

/**
 * Takes items from a pile, handling "sticky" items that might come together
 */
const takeItemsFromPile = <T>(pile: T[], index: number, rng: SeededRandom | Math): { items: T[], advanceBy: number } => {
    // Sometimes items might stick together
    const stickTogether = rng.random() < 0.1;
    const stickyCount = stickTogether ? 1 + Math.floor(rng.random() * 3) : 1;

    // Take up to stickyCount items, but don't exceed pile length
    const count = Math.min(stickyCount, pile.length - index);
    const items = pile.slice(index, index + count);

    return { items, advanceBy: count };
};

/**
 * Interleaves items from left and right piles
 */
const interleaveItems = <T>(left: T[], right: T[], rng: SeededRandom | Math): T[] => {
    const result: T[] = [];
    let leftIndex = 0;
    let rightIndex = 0;

    while (leftIndex < left.length || rightIndex < right.length) {
        // Determine which pile to process first
        const processLeftFirst = rng.random() > 0.5;

        if (processLeftFirst && leftIndex < left.length) {
            // Process left pile
            const { items, advanceBy } = takeItemsFromPile(left, leftIndex, rng);
            result.push(...items);
            leftIndex += advanceBy;

            // Process right pile (single item)
            if (rightIndex < right.length) {
                result.push(right[rightIndex]!);
                rightIndex++;
            }
        } else if (rightIndex < right.length) {
            // Process right pile
            const { items, advanceBy } = takeItemsFromPile(right, rightIndex, rng);
            result.push(...items);
            rightIndex += advanceBy;

            // Process left pile (single item)
            if (leftIndex < left.length) {
                result.push(left[leftIndex]!);
                leftIndex++;
            }
        }
    }

    return result;
};

/**
 * Riffle shuffle simulation - alternates items from two halves
 *
 * @param array The array to shuffle
 * @param iterations How many times to perform the shuffle
 * @param seed Optional seed for reproducible shuffling
 * @returns A new array of shuffled items
 */
export const riffleShuffle = <T>(array: T[], iterations = 3, seed?: number): T[] => {
    // Create random generator
    const rng = seed !== undefined ? new SeededRandom(seed) : Math;

    let result = [...array];

    for (let iter = 0; iter < iterations; iter++) {
        // Split the array into two halves
        const mid = Math.floor(result.length / 2);
        const left = result.slice(0, mid);
        const right = result.slice(mid);

        // Interleave the items
        result = interleaveItems(left, right, rng);
    }

    return result;
};

/**
 * USAGE EXAMPLES FOR UNIT TESTING
 *
 * The seed parameter allows for reproducible shuffling, which is useful
 * for unit testing and debugging. Example:
 *
 * // Unit test for shuffling
 * describe('Shuffle with seed', () => {
 *   it('should produce the same shuffle with the same seed', () => {
 *     const array1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 *     const array2 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 *     const seed = 42; // Any number will work as a seed
 *
 *     const shuffled1 = shuffle(array1, seed);
 *     const shuffled2 = shuffle(array2, seed);
 *
 *     expect(shuffled1).toEqual(shuffled2); // Arrays should be identical
 *     expect(shuffled1).not.toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // Should be shuffled
 *   });
 *
 *   it('should produce different shuffles with different seeds', () => {
 *     const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
 *
 *     const shuffled1 = shuffle([...array], 42);
 *     const shuffled2 = shuffle([...array], 43);
 *
 *     expect(shuffled1).not.toEqual(shuffled2); // Arrays should be different
 *   });
 * });
 */