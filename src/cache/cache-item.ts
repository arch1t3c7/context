import { Holdable } from '../util/holdable.js';
import type { CachePolicy } from './policy/cache-policy.js';

export type Cachable<TKey> = {
    /** The group the cachable item belongs to */
    name: string;

    /** The cache key used to determine uniqueness */
    cacheKey: TKey;

    /** Initializes the item */
    initialize?(): void | Promise<void>;

    /** Disposes the item */
    dispose?(): void | Promise<void>;

    /** Gets the cache policies for the cachable item */
    cachePolicies(): CachePolicy<TKey, unknown>[];
}


export class CacheItem<TKey, TItem extends Cachable<TKey>> extends Holdable<TItem> {
    initializing?: Promise<void>;
    disposing?: Promise<void>;

    get item() {
        return this.held;
    }

    constructor(item: TItem) {
        super(item);
    }

    async initialize() {
        if (typeof this.item.initialize === `function`) {
            this.initializing = this.item.initialize() as Promise<void>;
        }
    }

    async dispose() {
        if (typeof this.item.dispose === `function`) {
            this.disposing = this.item.dispose() as Promise<void>;
        }
    }
}
