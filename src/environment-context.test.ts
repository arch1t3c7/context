import { describe, expect, it, beforeEach } from '@jest/globals';
import { EnvironmentContext } from './environment-context';

type ProviderMap = {
    bar: () => any;
}

class TestContext extends EnvironmentContext<ProviderMap> {
    load = jest.fn();
    module = jest.fn();
    asyncModule = jest.fn(() => Promise.resolve()) as any;
}

describe(`EnvironmentContext`, () => {
    let config: {
        provider: {
            bar: undefined;
        };
        feature: {
            foo: undefined;
        }
    };
    let providers: {
        bar: () => Promise<{}>
    };

    beforeEach(() => {
        config = {
            provider: {
                bar: undefined,
            },
            feature: {
                foo: undefined,
            }
        };

        providers = {
            bar: () => Promise.resolve({ })
        };
    });

    describe(`constructor`, () => {
        it(`should define the config property`, () => {
            const instance = new TestContext(config, providers, { foo: `bar` });
            expect(instance.config).toBe(config);
        });

        it(`should define the defaultProviders property`, () => {
            const instance = new TestContext(config, providers, { foo: `bar` });

            expect(instance.defaultProviders).toEqual({ foo: `bar` });
        });
    })

    describe(`instance`, () => {        
        let instance: TestContext;

        beforeEach(() => {
            instance = new TestContext(config, providers, { foo: `bar` });
        })

        describe(`providerConfig`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.providerConfig).toBe(`function`);
            });

            it(`should return the config section for the provider`, () => {
                const conf = instance.providerConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(config.provider.bar);
            });
        });

        describe(`featureConfig`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.featureConfig).toBe(`function`);
            });
            it(`should return the config section for the feature`, () => {
                const conf = instance.featureConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(config.feature.foo);
            });
        });
    });
});
