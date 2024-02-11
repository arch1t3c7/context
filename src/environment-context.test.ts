import { describe, expect, it, beforeEach } from '@jest/globals';
import { EnvironmentContext } from './environment-context.js';
import { Provider } from './provider.js';

type ProviderMap = {
    bar: () => Promise<Provider<{ foo: () => Promise<any> }>>;
}

class TestContext extends EnvironmentContext<ProviderMap> { }

describe(`EnvironmentContext`, () => {
    let config: {
        provider: {
            bar: undefined;
        };
        feature: {
            foo: undefined;
        }
    };

    let fooFeature: {};
    let features: {
        foo: () => Promise<typeof fooFeature>
    };
    let barProvider: Provider<typeof features>;
    let providers: ProviderMap;

    beforeEach(() => {
        fooFeature = {};
        barProvider = {
            feature: {
                foo: () => Promise.resolve(fooFeature)
            }
        } as Provider<typeof features>;

        config = {
            provider: {
                bar: undefined,
            },
            feature: {
                foo: undefined,
            }
        };

        providers = {
            bar: () => Promise.resolve(barProvider)
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

        it(`should set defaultProviders to an empty object when not supplied`, () => {
            const instance = new TestContext(config, providers);

            expect(instance.defaultProviders).toEqual(expect.any(Object));
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

        describe(`module`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.module).toBe(`function`);
            });

            it(`should return undefined by default`, () => {
                const conf = instance.module(`an name`);
                expect(conf).toBe(undefined);
            });
        });

        describe(`asyncModule`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.asyncModule).toBe(`function`);
            });

            it(`should return undefined by default`, async () => {
                const conf = await instance.asyncModule(`an name`);
                expect(conf).toBe(undefined);
            });
        });
    });
});
