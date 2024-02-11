import { describe, expect, it } from '@jest/globals';
import { GlobalCachePolicy } from './global-cache-policy.js';
import { CacheItem } from '../cache-item.js';

describe(`GlobalCachePolicy`, () => {
    let instance: GlobalCachePolicy<string>;

    beforeEach(() => {
        instance = new GlobalCachePolicy();
    });

    describe(`onHold`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.onHold).toBe(`function`);
        });

        it(`should place a hold on the item`, () => {
            const cachable = {
                name: `test`,
                cacheKey: `test`,
                cachePolicies: () => [],
            };

            const item = new CacheItem(cachable);

            expect(item.count).toBe(0);
            instance.onHold(item);
            expect(item.count).toBe(1);
        });
    });
});
