import { describe, expect, it, beforeEach } from '@jest/globals';
import { EnvironmentContext } from './environment-context';

type TestConfig = {
    provider: {
        bar: {};
    };
    feature: {
        foo: {};
    };
}

type FeatureMap = {
    foo: [{}, {}];
}

type ProviderMap = {
    bar: [() => any, {}];
}

class TestContext extends EnvironmentContext<ProviderMap, FeatureMap, TestConfig> {
    load = jest.fn();
    module = jest.fn();
    asyncModule = jest.fn(() => Promise.resolve()) as any;
}

describe(`EnvironmentContext`, () => {
    const config = {
        provider: {
            bar: { },
        },
        feature: {
            foo: { },
        }
    };
    describe(`constructor`, () => {
        it(`should define the config property`, () => {
            const provider: Record<keyof FeatureMap, keyof ProviderMap> = { foo: `bar` };

            const instance = new TestContext(config, provider);
            expect(instance.config).toBe(config);
        });

        it(`should define the provider property`, () => {
            const provider: Record<keyof FeatureMap, keyof ProviderMap> = { foo: `bar` };

            const instance = new TestContext(config, provider);
            expect(instance.provider).toEqual({ foo: `bar` });
        });
    })

    describe(`instance`, () => {        
        let instance: TestContext;

        beforeEach(() => {
            instance = new TestContext(config);
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
