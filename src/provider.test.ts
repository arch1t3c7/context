import { describe, expect, it, beforeEach } from '@jest/globals';
import { Provider } from './provider.js';

class TestProvider extends Provider<any, any> {
    loadFeature = jest.fn();
    cachePolicies = jest.fn(() => []);
}

describe(`Provider`, () => {
    describe(`constructor`, () => {
        it(`should initialize the "name" property`, () => {
            const instance = new TestProvider({ }, { });

            expect(instance.name).toBe(TestProvider.name);
        });

        it(`should initialize the "config" property`, () => {
            const config = {};
            const instance = new TestProvider({ }, config);

            expect(instance.config).toBe(config);
        });
        it(`should initialize the "cacheKey" property`, () => {
            const config = {};
            const instance = new TestProvider({ }, config);

            expect(instance.cacheKey).toBe(instance.generateCacheKey());
        });
    });

    describe(`instance`, () => {
        let instance: Provider<any, any>;

        beforeEach(() => {
            instance = new TestProvider({}, {});
        });

        describe(`generateCacheKey`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.generateCacheKey).toBe(`function`);
            });
            it(`should generate a hash based on the config`, () => {
                const instance1 = new TestProvider({ }, { foo: `bar` });
                const instance2 = new TestProvider({ }, { bar: `foo` });
                const instance3 = new TestProvider({ }, { foo: `bar` });

                expect(instance1.generateCacheKey()).not.toEqual(instance2.generateCacheKey());
                expect(instance1.generateCacheKey()).toEqual(instance3.generateCacheKey());
            });
        });
    });
});
