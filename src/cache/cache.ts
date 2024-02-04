import { Cachable } from './cache-item';
import { ReferenceCache } from './reference-cache';

export class Cache<TKey, TCachable extends Cachable<TKey>> {
    #caches = new Map<string, ReferenceCache<TKey, TCachable>>();

    async hold(cachable: TCachable) {
        let cache = this.#caches.get(cachable.name);
        if (cache === undefined) {
            const policies = cachable.cachePolicies();
            cache = new ReferenceCache<TKey, TCachable>(policies);
            this.#caches.set(cachable.name, cache);
        }
        const item = await cache.hold(cachable);
        return item;
    }

    async release(cachable: TCachable) {
        const cache = this.#caches.get(cachable.name);
        if (cache === undefined) {
            return;
        }
        const item = await cache.release(cachable);
        return item;
    }

    async dispose() {
        const wait: Promise<void>[] = [];
        for (const [, value] of this.#caches) {
            wait.push(value.dispose());
        }
        await Promise.all(wait);
    }
}
