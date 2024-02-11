import { describe, expect, it } from '@jest/globals';
import { Cachable, CacheItem } from './cache-item.js';

describe(`CacheItem`, () => {
    describe(`constructor`, () => {
        it(`should alias the held item as "item"`, () => {
            const item = {};
            const cacheItem = new CacheItem(item as any);

            expect(cacheItem.item).toBe(item);
        });
    });

    describe(`instance`, () => {
        let cachable: Cachable<string>;
        let instance: CacheItem<string, Cachable<string>>;
        let initializePromise: Promise<void>;
        let disposePromise: Promise<void>;

        beforeEach(() => {
            initializePromise = Promise.resolve();
            disposePromise = Promise.resolve();

            cachable = {
                name: `test`,
                cacheKey: `test`,
                cachePolicies: () => [],
                initialize: jest.fn(() => initializePromise),
                dispose: jest.fn(() => disposePromise),
            };

            instance = new CacheItem(cachable);
        });

        describe(`initialize`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.initialize).toBe(`function`);
            });

            it(`should call initialize on the item`, async () => {
                await instance.initialize();

                expect(cachable.initialize).toHaveBeenCalled();
            });

            it(`should assign the initialize promise to "initializing"`, async () => {
                await instance.initialize();

                expect(instance.initializing).toBe(initializePromise);
            });
        });

        describe(`dispose`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.dispose).toBe(`function`);
            });

            it(`should call dispose on the item`, async () => {
                await instance.dispose();

                expect(cachable.dispose).toHaveBeenCalled();
            });

            it(`should assign the dispose promise to "disposing"`, async () => {
                await instance.dispose();

                expect(instance.disposing).toBe(disposePromise);
            });
        });
    });

});