import type { CacheItem, Cachable } from '../cache-item';
import { CachePolicy } from './cache-policy';

export class GlobalCachePolicy<TKey> extends CachePolicy<TKey, void> {
    onHold(item: CacheItem<TKey, Cachable<TKey>>) {
        super.onHold(item);
        // Never lets go
        item.hold();
    }
}
