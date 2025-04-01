/**
 * Utility functions for working with Zustand stores
 */

/**
 * Creates selectors for a Zustand store to optimize component re-renders
 *
 * @param store The Zustand store
 * @returns A wrapped store with selectors
 */
export const createSelectors = <T extends object, R extends object = T>(
    store: (callback: (state: T) => unknown) => unknown
) => {
    type StateKeys = keyof T;
    type Selector<K extends StateKeys> = (state: T) => T[K];

    const storeWithSelectors = store as typeof store & {
        use: {
            [K in StateKeys]: () => T[K]
        }
    };

    storeWithSelectors.use = {} as any;

    // Create a selector for each key in the store
    type Keys = keyof T;
    (Object.keys(store(state => state)) as Keys[]).forEach((key) => {
        const selector: Selector<typeof key> = state => state[key];

        storeWithSelectors.use[key] = () => store(selector) as T[typeof key];
    });

    return storeWithSelectors;
};

/**
 * Creates a store slice for advanced Zustand stores
 * Useful for modularizing complex stores
 *
 * @param set The set function from Zustand
 * @param get The get function from Zustand
 * @param api The API object from Zustand
 * @param initialState The initial state for this slice
 * @returns A store slice with state and actions
 */
export const createStoreSlice = <
    T extends object,
    SliceState extends object,
    SliceActions extends object
>(
    set: (
        partial: T | Partial<T> | ((state: T) => T | Partial<T>),
        replace?: boolean
    ) => void,
    get: () => T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    api: any,
    initialState: SliceState,
    createActions: (
        set: typeof set,
        get: typeof get,
        api: typeof api
    ) => SliceActions
): [SliceState, SliceActions] => {
    const state = initialState;
    const actions = createActions(set, get, api);

    return [state, actions];
};

/**
 * Type-safe version of createSelector that enforces return type
 *
 * @param selector The selector function
 */
export const createSelector = <T extends object, U>(
    selector: (state: T) => U
) => selector;

/**
 * Creates a middleware that logs state changes
 *
 * @param name Optional name for the store in logs
 */
export const createLogMiddleware = <T extends object>(
    name = 'store'
) => (
    config: (
        set: (
            partial: T | Partial<T> | ((state: T) => T | Partial<T>),
            replace?: boolean
        ) => void,
        get: () => T,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api: any
    ) => T
) => (
    set: Parameters<typeof config>[0],
    get: Parameters<typeof config>[1],
    api: Parameters<typeof config>[2]
) => config(
    (partial, replace) => {
        const previousState = get();
        set(partial, replace);
        const newState = get();

        // eslint-disable-next-line no-console
        console.log(`[${name}] State updated:`, {
            previousState,
            newState,
            partial,
        });
    },
    get,
    api
);

/**
 * Creates a middleware that tracks action performance
 *
 * @param name Optional name for the store in logs
 */
export const createPerformanceMiddleware = <T extends object>(
    name = 'store'
) => (
    config: (
        set: (
            partial: T | Partial<T> | ((state: T) => T | Partial<T>),
            replace?: boolean
        ) => void,
        get: () => T,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        api: any
    ) => T
) => (
    set: Parameters<typeof config>[0],
    get: Parameters<typeof config>[1],
    api: Parameters<typeof config>[2]
) => {
            // Create a proxy around the store to track methods
            const store = config(set, get, api);

            const proxiedStore = {} as T;

            // Create proxies for all methods to measure performance
            Object.entries(store).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (proxiedStore as any)[key] = (...args: any[]) => {
                        const startTime = performance.now();
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const result = (value as any)(...args);
                        const endTime = performance.now();

                        // eslint-disable-next-line no-console
                        console.log(`[${name}] ${key} took ${endTime - startTime}ms`);

                        return result;
                    };
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (proxiedStore as any)[key] = value;
                }
            });

            return proxiedStore;
        };

/**
 * Helper to create a bound action from a Zustand store
 *
 * @param store The Zustand store
 * @param action The action to bind
 */
export const createBoundAction = <T extends object, Args extends unknown[], Return>(
    store: { setState: (partial: Partial<T>) => void; getState: () => T },
    action: (state: T, ...args: Args) => Return
) => {
    return (...args: Args): Return => {
        const state = store.getState();
        return action(state, ...args);
    };
};