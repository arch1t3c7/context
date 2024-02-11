import type { CachePolicy } from './policy/cache-policy.js';
import { CacheItem, type Cachable } from './cache-item.js';
import { HoldableEvent } from '../util/holdable.js';

export class ReferenceCache<
    TKey,
    TCachable extends Cachable<TKey>,
> {
    #cache = new Map<TKey, CacheItem<TKey, TCachable>>();
    policies: CachePolicy<TKey, unknown>[];

    constructor(policies: CachePolicy<TKey, unknown> | CachePolicy<TKey, unknown>[]) {
        if (!Array.isArray(policies)) {
            policies = [policies];
        }
        this.policies = policies;
    }

    async hold(cachable: TCachable) {
        let cacheItem = this.#hold(cachable);
        if (cacheItem.disposing) {
            // Wait for the previous to dispose, then re-add
            await cacheItem.disposing;
            cacheItem = this.#hold(cachable);
        }

        await cacheItem.initializing;
        return cacheItem.item;
    }

    async release(cachable: TCachable) {
        const cacheItem = this.#release(cachable);

        if (!cacheItem) {
            // If we have no cache item, we assume a cache policy of none
            //  was applied, thus we will immedietely dispose
            if (typeof cachable.dispose === `function`) {
                await cachable.dispose();
            }
            return cachable;
        }

        return cacheItem.item;
    }

    has(cachable: TCachable) {
        const cacheItem = this.#cache.get(cachable.cacheKey);
        return Boolean(cacheItem);
    }

    get(cachable: TCachable) {
        const cacheItem = this.#cache.get(cachable.cacheKey);
        return cacheItem?.item;
    }

    async dispose() {
        const wait: (Promise<void> | void)[] = [];

        for (const policy of this.policies) {
            wait.push(policy.dispose());
        }

        for (const [,value] of this.#cache) {
            wait.push(value.dispose());
        }
        this.#cache.clear();

        await Promise.all(wait);
    }

    #hold(cachable: TCachable) {
        if (cachable.cacheKey === undefined) {
            // This should not be cached, so return a placeholder item
            const item = new CacheItem<TKey, TCachable>(cachable);
            item.initialize();
            return item;
        }

        const existing = this.#cache.get(cachable.cacheKey);
        if (existing) {
            for (const policy of this.policies) {
                policy.onHit(existing);
            }
            return existing;
        }

        const item = new CacheItem<TKey, TCachable>(cachable);
        this.#cache.set(cachable.cacheKey, item);

        // Make sure the external consumer gets a hold
        item.hold();
        for (const policy of this.policies) {
            policy.onHold(item);
        }

        item.on(HoldableEvent.released, async (count) => {
            if (count > 0) {
                return;
            }

            try {
                await item.dispose();
            } finally {
                this.#cache.delete(item.item.cacheKey);
            }
        });

        item.initialize();
        return item;
    }

    #release(cachable: TCachable) {
        const existing = this.#cache.get(cachable.cacheKey);
        if (!existing) {
            return undefined;
        }

        // Make sure the consumer releases their hold
        existing.release();

        for (const policy of this.policies) {
            policy.onRelease(existing);
        }

        return existing;
    }
}
