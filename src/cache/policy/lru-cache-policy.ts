import type { CacheItem, Cachable } from '../cache-item.js';
import { CachePolicy } from './cache-policy.js';

export interface LruCachePolicyConfig {
    count: number;
}

export class LruCachePolicy<TKey> extends CachePolicy<TKey, LruCachePolicyConfig> {
    #items = new Map<TKey, CacheItem<TKey, Cachable<TKey>>>();

    onHold(item: CacheItem<TKey, Cachable<TKey>>): void {
        super.onHold(item);
        item.hold();
        this.#items.set(item.item.cacheKey, item);
        this.#limit();
    }

    onHit(item: CacheItem<TKey, Cachable<TKey>>) {
        super.onHit(item);

        // Move it to the end
        this.#items.delete(item.item.cacheKey);
        this.#items.set(item.item.cacheKey, item);
    }

    dispose() {
        this.#items.clear();
        return super.dispose();
    }

    #first() {
        const values = this.#items.entries();
        const item = values.next();

        /* c8 ignore start */
        if (values.return) {
            values.return();
        }
        /* c8 ignore end */

        /* c8 ignore start */
        if (item.done) {
            return undefined;
        /* c8 ignore end */
        } else {
            return item.value;
        }
    }

    #limit() {
        while (this.#items.size > this.config.count) {
            const [key, value] = this.#first()!;
            this.#items.delete(key);
            value.release();
        }
    }
}
