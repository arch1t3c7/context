import { describe, expect, it, beforeEach } from '@jest/globals';
import { Cache } from './cache';
import { Cachable, CacheItem } from './cache-item';
import { CachePolicy } from './policy/cache-policy';

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

describe(`Cache`, () => {
    let instance: Cache<string, Cachable<string>>;

    beforeEach(() => {
        instance = new Cache();
    });

    describe(`hold`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.hold).toBe(`function`);
        });
        it(`should read the policies once per unique name`, async () => {
            const cachable1 = cachable(`test`, `name1`);
            const cachable2 = cachable(`test`, `name2`);
            const cachable3 = cachable(`test`, `name1`);

            await instance.hold(cachable1);
            await instance.hold(cachable2);
            await instance.hold(cachable3);

            expect(cachable1.cachePolicies).toBeCalled();
            expect(cachable2.cachePolicies).toBeCalled();
            expect(cachable3.cachePolicies).not.toBeCalled();
        });
        it(`should return the same item when none is cached`, async () => {
            const item = cachable(`test`, `name`);
            const result = await instance.hold(item);
            expect(result).toBe(item);
        });
        it(`should return the previous item when one is cached`, async () => {
            const item1 = cachable(`test`, `name`);
            const item2 = cachable(`test`, `name`);

            await instance.hold(item1);
            const result = await instance.hold(item2);

            expect(result).toBe(item1);
        });
    });

    describe(`release`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.release).toBe(`function`);
        });

        it(`should return undefined if the name has never been cached`, async () => {
            const item = cachable(`test`, `name`);
            const result = await instance.release(item);
            expect(result).toBe(undefined);
        });

        it(`should not dispose the item if it is not released by all policies`, async () => {
            const policy = new TestPolicy();
            const item = cachable(`test`, `name`);
            item.cachePolicies = jest.fn(() => [policy]);

            await instance.hold(item);
            await instance.release(item);

            expect(item.dispose).not.toBeCalled();
        });

        it(`should dispose the item if it is released by all policies`, async () => {
            const policy = new TestPolicy();
            const item = cachable(`test`, `name`);
            item.cachePolicies = jest.fn(() => [policy]);

            await instance.hold(item);
            policy.items[0].release();
            await instance.release(item);

            expect(item.dispose).toBeCalled();
        });
    });

    describe(`dispose`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.dispose).toBe(`function`);
        });

        it(`should dispose all cached items`, async () => {
            const item1 = cachable(`test1`, `name`);
            const item2 = cachable(`test2`, `name`);

            await instance.hold(item1);
            await instance.hold(item2);
            await instance.dispose();

            expect(item1.dispose).toBeCalled();
            expect(item2.dispose).toBeCalled();
        });
    });
});

function cachable<T = string>(key: T, name = `test`): Cachable<T> {
    return {
        name,
        cacheKey: key,

        initialize: jest.fn(() => Promise.resolve()),
        dispose: jest.fn(() => Promise.resolve()),

        cachePolicies: jest.fn(() => []),
    };
}