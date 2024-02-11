import type { CacheItem, Cachable } from '../cache-item.js';
import { HoldableEvent } from '../../util/holdable.js';
import { CachePolicy } from './cache-policy.js';
import { AnyFunc } from '../../type.js';

export interface TimedCachePolicyConfig {
    time: number;
}

export class TimedCachePolicy<TKey> extends CachePolicy<TKey, TimedCachePolicyConfig> {
    #timer = new Map<TKey, ReturnType<typeof setTimeout>>();
    #onHeldEventHandler?: AnyFunc;
    #onReleasedEventHandler?: AnyFunc;

    onHold(item: CacheItem<TKey, Cachable<TKey>>) {
        super.onHold(item);

        // this.#onHeldEvent = () => this.#onHeld()
        const self = this;
        this.#onHeldEventHandler = function (this: CacheItem<TKey, Cachable<TKey>>) { self.#onHeld(this); };
        this.#onReleasedEventHandler = function (this: CacheItem<TKey, Cachable<TKey>>) { self.#onReleased(this); };

        item.on(HoldableEvent.held, this.#onHeldEventHandler);
        item.on(HoldableEvent.released, this.#onReleasedEventHandler);
        item.hold();
    }

    onHit(item: CacheItem<TKey, Cachable<TKey>>) {
        super.onHit(item);
        // Reset the timers if anything hits the item
        // TODO: Is this redundant with the onHeld event handler?
        this.#clear(item);
    }

    dispose() {
        for (const value of this.#timer.values()) {
            clearTimeout(value);
        }
    }

    #onHeld(item: CacheItem<TKey, Cachable<TKey>>) {
        // TODO: The issue is we have a cache item raising the event
        //  and using this as context... but we need this to call #clear

        // Reset any timers if anything grabs the item
        this.#clear(item);
    }
    
    #onReleased(item: CacheItem<TKey, Cachable<TKey>>) {
        // We want to start the timer when we are the only thing holding
        //  onto the item
        if (item.count > 1) {
            return;
        }

        // Clear any existing timer
        this.#clear(item);

        // Set a new timer
        this.#timer.set(
            item.item.cacheKey,
            setTimeout(() => this.#release(item), this.config.time),
        );
    }

    #release = (item: CacheItem<TKey, Cachable<TKey>>) => {
        item.off(HoldableEvent.held, this.#onHeldEventHandler!);
        item.off(HoldableEvent.released, this.#onReleasedEventHandler!);
        item.release();
    }

    #clear(item: CacheItem<TKey, Cachable<TKey>>) {
        const timer = this.#timer.get(item.item.cacheKey);
        if (timer !== undefined) {
            clearTimeout(timer);
            this.#timer.delete(item.item.cacheKey);
        }
    }
}
