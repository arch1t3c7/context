import { describe, expect, it, beforeEach } from '@jest/globals';
import { ReferenceCache } from './reference-cache.js';
import { CachePolicy } from './policy/cache-policy.js';
import { Cachable, CacheItem } from './cache-item.js';
import { Deferred } from '../util/deferred.js';

class TestPolicy extends CachePolicy<string, void> {
    items: CacheItem<string, any>[] = [];

    onHold = jest.fn((item) => {
        item.hold();
        this.items.push(item);
    });
    onHit = jest.fn();
    onRelease = jest.fn();
    dispose = jest.fn();
}

describe(`ReferenceCache`, () => {
    let policy: TestPolicy;

    beforeEach(() => {
        policy = new TestPolicy();
    });

    describe(`constructor`, () => {
        it(`should assign the policies property`, () => {
            const instance = new ReferenceCache(policy);

            expect(Array.isArray(instance.policies)).toBe(true);
            expect(instance.policies[0]).toBe(policy);
        });
    });

    describe(`instance`, () => {
        let instance: ReferenceCache<string | undefined, Cachable<string | undefined>>;

        beforeEach(() => {
            instance = new ReferenceCache(policy);
        });

        describe(`hold`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.hold).toBe(`function`);
            });

            // cacheKey undefined branch
            it(`should call initialize on the item if cacheKey is undefined`, async () => {
                const item = cachable(undefined);

                await instance.hold(item);

                expect(item.initialize).toHaveBeenCalled();
            });

            it(`should call "onHold" on the policy`, async () => {
                const item = cachable(`test`);

                await instance.hold(item);

                expect(policy.onHold).toHaveBeenCalled();
            });

            it(`should call initialize on the item when the item is uncached`, async () => {
                const item = cachable(`test`);

                await instance.hold(item);

                expect(item.initialize).toHaveBeenCalled();
            });

            // Cached item branch
            it(`should call "onHit" on the policy if a cached instance exists`, async () => {
                const item1 = cachable(`test`);
                const item2 = cachable(`test`);

                await instance.hold(item1);
                await instance.hold(item2);

                expect(policy.onHit).toHaveBeenCalledTimes(1);
            });

            // Async branches
            it(`should wait if an existing item is being disposed`, async () => {
                const deferred = new Deferred();
                const item1 = cachable(`test`);
                const item2 = cachable(`test`);

                item1.dispose = jest.fn(() => deferred.promise);

                await instance.hold(item1);

                // Release the policy lock
                policy.items[0].release();
                instance.release(item1);

                const item2Prom = instance.hold(item2).then(() => true);

                let held = await Promise.race([
                    item2Prom,
                    new Promise((res) => setTimeout(res, 1)).then(() => false),
                ]);

                expect(held).toBe(false);
                deferred.resolve();

                held = await Promise.race([
                    item2Prom,
                    new Promise((res) => setTimeout(res, 1)).then(() => false),
                ]);

                expect(held).toBe(true);
            });
            it(`should wait for the item to be initialized`, async () => {
                const deferred = new Deferred();
                const item1 = cachable(`test`);

                item1.initialize = jest.fn(() => deferred.promise);

                const holdResult = instance.hold(item1).then(() => true);

                let held = await Promise.race([
                    holdResult,
                    new Promise((res) => setTimeout(res, 1)).then(() => false),
                ]);

                expect(held).toBe(false);
                deferred.resolve();

                held = await Promise.race([
                    holdResult,
                    new Promise((res) => setTimeout(res, 1)).then(() => false),
                ]);

                expect(held).toBe(true);
            });

            it(`dispose the item if no policy has a hold`, async () => {
                const policy1 = new TestPolicy();
                const policy2 = new TestPolicy();
                const instance = new ReferenceCache([policy1, policy2]);

                const item = cachable(`test`);
                item.dispose = jest.fn();

                await instance.hold(item);
                await instance.release(item);

                policy1.items[0].release();
                expect(item.dispose).not.toBeCalled();

                policy2.items[0].release();
                expect(item.dispose).toBeCalled();
            });

            it(`remove the item if no policy has a hold`, async () => {
                const policy1 = new TestPolicy();
                const policy2 = new TestPolicy();
                const instance = new ReferenceCache([policy1, policy2]);

                const item = cachable(`test`);

                await instance.hold(item);
                await instance.release(item);

                expect(policy1.items[0].count).toBe(2);
                const second = cachable(`test`);

                let existing = await instance.hold(second);
                expect(existing).toBe(item);

                policy1.items[0].release();
                policy2.items[0].release();

                existing = await instance.hold(second);
                expect(existing).toBe(second);
            });
        });

        describe(`release`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.release).toBe(`function`);
            });

            it(`should call onRelease on the policies`, async () => {
                const item = cachable(`test`);

                await instance.hold(item);
                await instance.release(item);

                expect(policy.onRelease).toHaveBeenCalled();
            });
            it(`should dispose the item if it is not cached`, async () => {
                const item = cachable(undefined);
                item.dispose = jest.fn();

                await instance.hold(item);
                await instance.release(item);

                expect(item.dispose).toHaveBeenCalled();
            });
        });

        describe(`has`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.has).toBe(`function`);
            });

            it(`should return true if the cache has the item`, async () => {
                const item1 = cachable(`test`);
                const item2 = cachable(`test`);

                await instance.hold(item1);

                expect(instance.has(item2)).toBe(true);
            });
            it(`should return false if the cache does not have the item`, async () => {
                const item1 = cachable(`test1`);
                const item2 = cachable(`test2`);

                await instance.hold(item1);

                expect(instance.has(item2)).toBe(false);
            });
        });

        describe(`get`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.get).toBe(`function`);
            });

            it(`should return the cached item if the cache has the item`, async () => {
                const item1 = cachable(`test`);
                const item2 = cachable(`test`);

                await instance.hold(item1);

                expect(instance.get(item2)).toBe(item1);
            });
            it(`should return undefined if the cache does not have the item`, async () => {
                const item1 = cachable(`test1`);
                const item2 = cachable(`test2`);

                await instance.hold(item1);

                expect(instance.get(item2)).toBe(undefined);
            });
        });

        describe(`dispose`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.dispose).toBe(`function`);
            });

            it(`should dispose all attached policies`, async () => {
                const policy1 = new TestPolicy();
                const policy2 = new TestPolicy();
                const instance = new ReferenceCache([policy1, policy2]);

                await instance.dispose();

                expect(policy1.dispose).toBeCalled();
                expect(policy2.dispose).toBeCalled();
            });
            it(`should dispose all cached items`, async () => {
                const item1 = cachable(`test1`);
                const item2 = cachable(`test2`);

                item1.dispose = jest.fn();
                item2.dispose = jest.fn();

                await instance.hold(item1);
                await instance.hold(item2);

                await instance.dispose();

                expect(item1.dispose).toHaveBeenCalled();
                expect(item2.dispose).toHaveBeenCalled();
            });
        });
    });
});

function cachable<T = string>(key: T): Cachable<T> {
    return {
        name: `test`,
        cacheKey: key,

        initialize: jest.fn(() => Promise.resolve()),
        dispose: jest.fn(() => Promise.resolve()),

        cachePolicies: jest.fn(),
    };
}