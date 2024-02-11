import { describe, expect, it } from '@jest/globals';
import { LruCachePolicy } from './lru-cache-policy.js';
import { CacheItem } from '../cache-item.js';

describe(`LruCachePolicy`, () => {
    const count = 2;
    let instance: LruCachePolicy<string>;

    beforeEach(() => {
        instance = new LruCachePolicy({ count });
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

        it(`should release any items which exceed the lru size (${count})`, () => {
            const cachable1 = cacheItem(`test1`);
            const cachable2 = cacheItem(`test2`);
            const cachable3 = cacheItem(`test3`);
            const cachable4 = cacheItem(`test4`);

            instance.onHold(cachable1);
            expect(cachable1.count).toBe(1);

            instance.onHold(cachable2);
            expect(cachable1.count).toBe(1);
            expect(cachable2.count).toBe(1);

            instance.onHold(cachable3);
            expect(cachable1.count).toBe(0);
            expect(cachable2.count).toBe(1);
            expect(cachable3.count).toBe(1);

            instance.onHold(cachable4);
            expect(cachable1.count).toBe(0);
            expect(cachable2.count).toBe(0);
            expect(cachable3.count).toBe(1);
            expect(cachable4.count).toBe(1);
        });
    });

    describe(`onHit`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.onHit).toBe(`function`);
        });

        it(`Should move the item to the end of the LRU queue`, () => {
            const cachable1 = cacheItem(`test1`);
            const cachable2 = cacheItem(`test2`);
            const cachable3 = cacheItem(`test3`);

            instance.onHold(cachable1);
            expect(cachable1.count).toBe(1);

            instance.onHold(cachable2);
            expect(cachable1.count).toBe(1);
            expect(cachable2.count).toBe(1);

            instance.onHit(cachable1);

            instance.onHold(cachable3);
            expect(cachable1.count).toBe(1);
            expect(cachable2.count).toBe(0);
            expect(cachable3.count).toBe(1);
        });
    });

    describe(`dispose`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.dispose).toBe(`function`);
        });

        it(`Should remove all items from the LRU queue`, async () => {
            const cachable1 = cacheItem(`test1`);
            const cachable2 = cacheItem(`test2`);
            const cachable3 = cacheItem(`test3`);
            const cachable4 = cacheItem(`test4`);

            instance.onHold(cachable1);
            
            expect(cachable1.count).toBe(1);

            instance.onHold(cachable2);
            expect(cachable1.count).toBe(1);
            expect(cachable2.count).toBe(1);

            instance.onHold(cachable3);
            expect(cachable1.count).toBe(0);
            expect(cachable2.count).toBe(1);
            expect(cachable3.count).toBe(1);

            await instance.dispose();

            instance.onHold(cachable4);
            expect(cachable1.count).toBe(0);
            // Note: These are 1 since on disposal they do not get released
            //  So, since they are still 1, we can infer that no release has
            //  happened when cachable4 was added
            expect(cachable2.count).toBe(1);
            expect(cachable3.count).toBe(1);
            expect(cachable4.count).toBe(1);
        });
    });
});

function cacheItem(key: string) {
    return new CacheItem({
        name: `test`,
        cacheKey: key,
        cachePolicies: () => []
    });
}
