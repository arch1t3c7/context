import { EventEmitter } from '../../util/event-emitter';
import type { Cachable, CacheItem } from '../cache-item';

export enum CachePolicyEvent {
    held = `held`,
    hit = `hit`,
    released = `released`,
}

export abstract class CachePolicy<TKey, TConfig> extends EventEmitter<CachePolicyEvent> {
    config: TConfig;

    constructor(config: TConfig) {
        super();
        this.config = config;
    }

    /* c8 ignore start */
    /** Called when the cache item is held */
    onHold(item: CacheItem<TKey, Cachable<TKey>>): void {
        // Placeholder
    }

    /** Called when the cache item is hit */
    onHit(item: CacheItem<TKey, Cachable<TKey>>): void {
        // Placeholder
    }

    /** Called when the cache item is released */
    onRelease(item: CacheItem<TKey, Cachable<TKey>>): void {
        // Placeholder
    }

    /** Called when the cache item is disposed */
    dispose(): void | Promise<void> {
        // Placeholder.
    }
    /* c8 ignore end */
}
