/**
 * IndexedDB service for client-side database storage
 */
import { BaseService, ServiceOptions, ServiceError } from '../serviceInterface';

export interface IndexedDBConfig extends ServiceOptions {
    dbName?: string;
    version?: number;
    migrationCallback?: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
}

interface StoreConfig {
    name: string;
    keyPath?: string;
    autoIncrement?: boolean;
    indices?: Array<{
        name: string;
        keyPath: string | string[];
        unique?: boolean;
    }>;
}

class IndexedDBService extends BaseService {
    private static instance: IndexedDBService;
    private dbName: string;
    private version: number;
    private db: IDBDatabase | null = null;
    private migrationCallback?: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
    private dbPromise: Promise<IDBDatabase> | null = null;

    private constructor(config: IndexedDBConfig = {}) {
        super(config);

        this.dbName = config.dbName || 'blackjack_db';
        this.version = config.version || 1;
        this.migrationCallback = config.migrationCallback;
    }

    public static getInstance(config?: IndexedDBConfig): IndexedDBService {
        if (!IndexedDBService.instance) {
            IndexedDBService.instance = new IndexedDBService(config);
        }
        return IndexedDBService.instance;
    }

    protected async initializeImpl(): Promise<void> {
        try {
            await this.openDatabase();
            this.log('IndexedDB service initialized');
        } catch (error) {
            this.logError('Failed to initialize IndexedDB', error);
            throw new ServiceError('Failed to initialize IndexedDB', 'INDEXEDDB_INIT_ERROR');
        }
    }

    protected async resetImpl(): Promise<void> {
        try {
            // Close the database connection
            if (this.db) {
                this.db.close();
                this.db = null;
            }

            // Delete the database
            await this.deleteDatabase();
            this.log('IndexedDB service reset');
        } catch (error) {
            this.logError('Failed to reset IndexedDB', error);
            throw new ServiceError('Failed to reset IndexedDB', 'INDEXEDDB_RESET_ERROR');
        }
    }

    /**
     * Create a new object store in the database
     */
    public async createStore(config: StoreConfig): Promise<void> {
        if (!this.db) {
            await this.openDatabase();
        }

        const db = this.db;

        if (!db) {
            throw new ServiceError('Database not open', 'INDEXEDDB_NOT_OPEN');
        }

        // Can't create stores outside of version change transactions
        if (!db.objectStoreNames.contains(config.name)) {
            throw new ServiceError(
                `Cannot create store ${config.name} outside of version change transaction. ` +
                'Use upgradeDatabase to create new stores.',
                'INDEXEDDB_UPGRADE_REQUIRED'
            );
        }
    }

    /**
     * Upgrade the database to a new version
     */
    public async upgradeDatabase(newVersion: number, upgradeCallback: (db: IDBDatabase) => void): Promise<void> {
        // Close the current connection
        if (this.db) {
            this.db.close();
            this.db = null;
        }

        this.version = newVersion;

        // Open a new connection with the upgraded version
        const request = indexedDB.open(this.dbName, this.version);

        request.onupgradeneeded = (event) => {
            const db = request.result;
            const transaction = request.transaction;

            if (transaction) {
                transaction.onerror = (txError) => {
                    this.logError('Error during upgrade transaction', txError);
                };
            }

            upgradeCallback(db);
        };

        return new Promise<void>((resolve, reject) => {
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onerror = () => {
                this.logError('Error upgrading database', request.error);
                reject(new ServiceError(
                    `Failed to upgrade database: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_UPGRADE_ERROR'
                ));
            };
        });
    }

    /**
     * Add an item to a store
     */
    public async add<T>(storeName: string, item: T, key?: IDBValidKey): Promise<IDBValidKey> {
        return this.withStoreTx<IDBValidKey>(storeName, 'readwrite', (store) => {
            return new Promise((resolve, reject) => {
                let request: IDBRequest;

                if (key !== undefined) {
                    request = store.add(item, key);
                } else {
                    request = store.add(item);
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to add item to ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_ADD_ERROR'
                ));
            });
        });
    }

    /**
     * Put (add or update) an item in a store
     */
    public async put<T>(storeName: string, item: T, key?: IDBValidKey): Promise<IDBValidKey> {
        return this.withStoreTx<IDBValidKey>(storeName, 'readwrite', (store) => {
            return new Promise((resolve, reject) => {
                let request: IDBRequest;

                if (key !== undefined) {
                    request = store.put(item, key);
                } else {
                    request = store.put(item);
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to put item in ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_PUT_ERROR'
                ));
            });
        });
    }

    /**
     * Get an item from a store by key
     */
    public async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
        return this.withStoreTx<T | undefined>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to get item from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_GET_ERROR'
                ));
            });
        });
    }

    /**
     * Get all items from a store
     */
    public async getAll<T>(storeName: string, query?: IDBValidKey | IDBKeyRange, count?: number): Promise<T[]> {
        return this.withStoreTx<T[]>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                let request: IDBRequest;

                if (query !== undefined) {
                    request = store.getAll(query, count);
                } else {
                    request = store.getAll();
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to get all items from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_GETALL_ERROR'
                ));
            });
        });
    }

    /**
     * Get all keys from a store
     */
    public async getAllKeys(storeName: string, query?: IDBValidKey | IDBKeyRange, count?: number): Promise<IDBValidKey[]> {
        return this.withStoreTx<IDBValidKey[]>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                let request: IDBRequest;

                if (query !== undefined) {
                    request = store.getAllKeys(query, count);
                } else {
                    request = store.getAllKeys();
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to get all keys from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_GETALLKEYS_ERROR'
                ));
            });
        });
    }

    /**
     * Delete an item from a store by key
     */
    public async delete(storeName: string, key: IDBValidKey | IDBKeyRange): Promise<void> {
        return this.withStoreTx<void>(storeName, 'readwrite', (store) => {
            return new Promise((resolve, reject) => {
                const request = store.delete(key);

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new ServiceError(
                    `Failed to delete item from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_DELETE_ERROR'
                ));
            });
        });
    }

    /**
     * Clear all items from a store
     */
    public async clear(storeName: string): Promise<void> {
        return this.withStoreTx<void>(storeName, 'readwrite', (store) => {
            return new Promise((resolve, reject) => {
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new ServiceError(
                    `Failed to clear store ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_CLEAR_ERROR'
                ));
            });
        });
    }

    /**
     * Count items in a store
     */
    public async count(storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<number> {
        return this.withStoreTx<number>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                const request = key !== undefined ? store.count(key) : store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to count items in ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_COUNT_ERROR'
                ));
            });
        });
    }

    /**
     * Get items in a range using a cursor
     */
    public async getRange<T>(
        storeName: string,
        keyRange?: IDBKeyRange,
        direction?: IDBCursorDirection,
        limit?: number
    ): Promise<T[]> {
        return this.withStoreTx<T[]>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                const result: T[] = [];
                let count = 0;

                const request = store.openCursor(keyRange, direction);

                request.onsuccess = () => {
                    const cursor = request.result;

                    if (cursor && (!limit || count < limit)) {
                        result.push(cursor.value);
                        count++;
                        cursor.continue();
                    } else {
                        resolve(result);
                    }
                };

                request.onerror = () => reject(new ServiceError(
                    `Failed to get range from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_RANGE_ERROR'
                ));
            });
        });
    }

    /**
     * Get an item by index
     */
    public async getByIndex<T>(
        storeName: string,
        indexName: string,
        key: IDBValidKey | IDBKeyRange
    ): Promise<T | undefined> {
        return this.withStoreTx<T | undefined>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                const index = store.index(indexName);
                const request = index.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to get item by index ${indexName} from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_INDEX_GET_ERROR'
                ));
            });
        });
    }

    /**
     * Get all items by index
     */
    public async getAllByIndex<T>(
        storeName: string,
        indexName: string,
        key?: IDBValidKey | IDBKeyRange,
        count?: number
    ): Promise<T[]> {
        return this.withStoreTx<T[]>(storeName, 'readonly', (store) => {
            return new Promise((resolve, reject) => {
                const index = store.index(indexName);
                let request: IDBRequest;

                if (key !== undefined) {
                    request = index.getAll(key, count);
                } else {
                    request = index.getAll();
                }

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(new ServiceError(
                    `Failed to get all items by index ${indexName} from ${storeName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_INDEX_GETALL_ERROR'
                ));
            });
        });
    }

    /**
     * Delete the database
     */
    public async deleteDatabase(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const request = indexedDB.deleteDatabase(this.dbName);

            request.onsuccess = () => {
                this.log(`Database ${this.dbName} deleted successfully`);
                resolve();
            };

            request.onerror = () => {
                this.logError(`Error deleting database ${this.dbName}`, request.error);
                reject(new ServiceError(
                    `Failed to delete database ${this.dbName}: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_DELETE_DB_ERROR'
                ));
            };
        });
    }

    private async openDatabase(): Promise<IDBDatabase> {
        // If the database is already open, return it
        if (this.db) {
            return this.db;
        }

        // If there's a pending open operation, return its promise
        if (this.dbPromise) {
            return this.dbPromise;
        }

        // Create a new open operation promise
        this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = request.result;
                const oldVersion = event.oldVersion;
                const newVersion = event.newVersion;

                this.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);

                if (this.migrationCallback) {
                    this.migrationCallback(db, oldVersion, newVersion);
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.dbPromise = null;
                resolve(this.db);
            };

            request.onerror = () => {
                this.dbPromise = null;
                this.logError('Error opening database', request.error);
                reject(new ServiceError(
                    `Failed to open database: ${request.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_OPEN_ERROR'
                ));
            };
        });

        return this.dbPromise;
    }

    private async withStoreTx<T>(
        storeName: string,
        mode: IDBTransactionMode,
        callback: (store: IDBObjectStore) => Promise<T>
    ): Promise<T> {
        const db = await this.openDatabase();

        if (!db.objectStoreNames.contains(storeName)) {
            throw new ServiceError(
                `Object store ${storeName} does not exist`,
                'INDEXEDDB_STORE_NOT_FOUND'
            );
        }

        return new Promise<T>((resolve, reject) => {
            const transaction = db.transaction(storeName, mode);
            const store = transaction.objectStore(storeName);

            transaction.onerror = (event) => {
                this.logError(`Transaction error on store ${storeName}`, transaction.error);
                reject(new ServiceError(
                    `Transaction error: ${transaction.error?.message || 'Unknown error'}`,
                    'INDEXEDDB_TRANSACTION_ERROR'
                ));
            };

            // Execute the callback with the store
            callback(store)
                .then(resolve)
                .catch(reject);
        });
    }
}

export default IndexedDBService;