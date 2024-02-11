import { describe, expect, it, beforeEach } from '@jest/globals';
import { Provider } from './provider.js';

const features = {
    foo: jest.fn(() => Promise.resolve({}))
}

class TestProvider extends Provider<typeof features, any> {
    cachePolicies = jest.fn(() => []);
}

describe(`Provider`, () => {
    describe(`constructor`, () => {
        it(`should initialize the "name" property`, () => {
            const instance = new TestProvider(features, { });

            expect(instance.name).toBe(TestProvider.name);
        });

        it(`should initialize the "config" property`, () => {
            const config = {};
            const instance = new TestProvider(features, config);

            expect(instance.config).toBe(config);
        });
        it(`should initialize the "cacheKey" property`, () => {
            const config = {};
            const instance = new TestProvider(features, config);

            expect(instance.cacheKey).toBe(instance.generateCacheKey());
        });
    });

    describe(`instance`, () => {
        let instance: Provider<any, any>;

        beforeEach(() => {
            instance = new TestProvider(features, {});
        });

        describe(`generateCacheKey`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.generateCacheKey).toBe(`function`);
            });
            it(`should generate a hash based on the config`, () => {
                const instance1 = new TestProvider(features, { foo: `bar` });
                const instance2 = new TestProvider(features, { bar: `foo` });
                const instance3 = new TestProvider(features, { foo: `bar` });

                expect(instance1.generateCacheKey()).not.toEqual(instance2.generateCacheKey());
                expect(instance1.generateCacheKey()).toEqual(instance3.generateCacheKey());
            });
        });

        describe(`loadFeature`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.loadFeature).toBe(`function`);
            });
            it(`should select the given feature factory from the feature property`, async () => {
                await instance.loadFeature({}, `foo`, undefined);

                expect(features.foo).toBeCalled();
            });
            it(`should throw an error if the fearure does not exist`, async () => {
                await expect(instance.loadFeature({}, `a missing feature`, undefined)).rejects.toThrow();
            });
        })
    });
});
