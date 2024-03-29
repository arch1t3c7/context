import { describe, expect, it, beforeEach } from '@jest/globals';
import { FeatureContext } from './feature-context.js';
import { EnvironmentContext } from './environment-context.js';
import { ProviderContext } from './provider-context.js';
import { Provider } from './provider.js';

type ProviderMap = {
    bar: () => Promise<Provider<{ foo: () => Promise<any>, baz: () => Promise<any> }>>;
}

class TestEnvironmentContext extends EnvironmentContext<ProviderMap, void> {
    protected createServices(featureContext: FeatureContext<ProviderMap, void, void>): Promise<void> {
        throw new Error('Method not implemented.');
    }
    load = jest.fn();
    module = jest.fn();
    asyncModule = jest.fn(() => Promise.resolve()) as any;

    provider = { foo: `bar` as const }
}

if (!Symbol.dispose) {
    (Symbol as any).dispose = Symbol(`dipose`);
}
if (!Symbol.asyncDispose) {
    (Symbol as any).asyncDispose = Symbol(`async-dipose`);
}

describe(`FeatureContext`, () => {
    let environmentContext: TestEnvironmentContext;
    let providerContext: ProviderContext<ProviderMap>;
    let provider: TestProvider;

    let config: {
        provider: {
            bar: undefined;
        };
        feature: {
            foo: undefined;
            baz: undefined;
        }
    };

    let fooFeature: {
        feature?: {
            foo: undefined,
        },
        provider?: {
            bar: undefined,
        },
        symbol: Symbol,
    };
    let bazFeature: typeof fooFeature;
    let features: {
        foo: () => Promise<typeof fooFeature>,
        baz: () => Promise<typeof fooFeature>,
    };
    let barProvider: Provider<typeof features>;
    let providers: ProviderMap;

    class TestProvider extends Provider<typeof features> {
        cachePolicies = jest.fn(() => []);
    }

    beforeEach(() => {
        fooFeature = {
            symbol: Symbol(`foo feature`)
        };
        bazFeature = {
            symbol: Symbol(`baz feature`)
        };
        barProvider = {
            feature: {
                foo: () => Promise.resolve(fooFeature),
                baz: () => Promise.resolve(bazFeature),
            }
        } as Provider<typeof features>;
        features = {
            foo: () => Promise.resolve(fooFeature),
            baz: () => Promise.resolve(bazFeature),
        };

        config = {
            provider: {
                bar: undefined,
            },
            feature: {
                foo: undefined,
                baz: undefined,
            }
        };

        providers = {
            bar: () => Promise.resolve(barProvider)
        };
    });

    beforeEach(() => {
        environmentContext = new TestEnvironmentContext(config, providers, { foo: `bar`, baz: `bar` });
        providerContext = new ProviderContext<ProviderMap>(environmentContext);
        provider = new TestProvider(features);

        providerContext.load = jest.fn(() => Promise.resolve(provider)) as any;
    });

    describe(`constructor`, () => {
        it(`should initialize the providerContext property`, () => {
            const instance = new FeatureContext<ProviderMap>(providerContext);
            
            expect(instance.providerContext).toBe(providerContext);
        });
    });

    describe(`instance`, () => {
        let instance: FeatureContext<ProviderMap>;

        beforeEach(() => {
            instance = new FeatureContext(providerContext);
        });

        describe(`feature`, () => {
            it(`should add feature loaders for all feature names on providers to the feature property`, () => {
                expect(typeof instance.feature.foo).toBe(`function`);
            });

            it(`should call the load function with the feature name`, async () => {
                instance.load = jest.fn();
                const featureConfig = Symbol(`feature-config`);
                const providerConfig = Symbol(`provider-config`);

                await instance.feature.foo(featureConfig as any, `bar`, providerConfig as any);

                expect(instance.load).toBeCalledWith(`foo`, featureConfig, `bar`, providerConfig);
            })
        });

        describe(`config`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.config).toBe(`function`);
            });

            it(`should use the context.configFeature to determine the feature when no feature is supplied`, async () => {
                instance.load = jest.fn();
                instance.configFeature = `foo`;

                const config = await instance.config();
                expect((config as any).symbol).toBe(fooFeature.symbol);
            });

            it(`should use the supplied feature to load the config`, async () => {
                instance.load = jest.fn();
                instance.configFeature = `foo`;

                const config = await instance.config(`baz`);
                expect((config as any).symbol).toBe(bazFeature.symbol);
            });

            it(`should return undefined if no feature is defined`, async () => {
                instance.load = jest.fn();
                instance.configFeature = undefined;

                expect(await instance.config()).toBe(undefined);
            });

            it(`should call the load function with the feature name`, async () => {
                instance.load = jest.fn();
                const featureConfig = Symbol(`feature-config`);
                const providerConfig = Symbol(`provider-config`);

                await instance.feature.foo(featureConfig as any, `bar`, providerConfig as any);

                expect(instance.load).toBeCalledWith(`foo`, featureConfig, `bar`, providerConfig);
            })
        });

        describe(`load`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.load).toBe(`function`);
            });

            it(`should use the environmentContext.provider object to lookup the provider when none is supplied`, async () => {
                providerContext.load = jest.fn(() => provider) as any;

                await instance.load(`foo`, undefined);

                expect(providerContext.load).toBeCalledWith(`bar`, {}, instance);
            });

            it(`should throw an error if no provider is supplied and the default could not be found`, async () => {
                await expect(instance.load(`some other value` as any, undefined)).rejects.toThrow();
            });
            
            it(`should use the environmentContext.providerConfig function to load the base config`, async () => {
                environmentContext.providerConfig = jest.fn();

                await instance.load(`foo`, undefined);

                expect(environmentContext.providerConfig).toBeCalledWith(instance, `bar`, `foo`);
            });

            it(`should combine the base config with the supplied config when calling the providerContext.load`, async () => {
                const envConfig = { foo: Symbol(`foo`) };
                const suppliedConfig = { bar: Symbol(`bar`) };

                environmentContext.providerConfig = jest.fn(() => envConfig) as any;
                await instance.load(`foo`, envConfig, `bar`, suppliedConfig as any);

                expect(providerContext.load).toBeCalledWith(`bar`, {
                    ...envConfig,
                    ...suppliedConfig,
                }, instance);
            });

            it(`should use the environmentContext.featureConfig function to load the base feature config`, async () => {
                environmentContext.featureConfig = jest.fn();

                await instance.load(`foo`, undefined);

                expect(environmentContext.featureConfig).toBeCalledWith(instance, `bar`, `foo`);
            });

            it(`should combine the base config with the supplied config when calling the provider.feature`, async () => {
                provider.loadFeature = jest.fn();
                const envConfig = { foo: Symbol(`foo`) };
                const suppliedConfig = { bar: Symbol(`bar`) };

                environmentContext.featureConfig = jest.fn(() => envConfig);
                await instance.load(`foo`, suppliedConfig);

                expect(provider.loadFeature).toBeCalledWith(instance, `foo`, {
                    ...envConfig,
                    ...suppliedConfig,
                });
            });

            it(`should attach a syncronous disposal`, async () => {
                const feat = await instance.load(`foo`, undefined);
                expect(typeof feat[Symbol.dispose]).toBe(`function`);
            });

            it(`should attach a dispose function`, async () => {
                const feat = await instance.load(`foo`, undefined);
                expect(typeof feat.dispose).toBe(`function`);
            });

            it(`should add a hold on the provider in the cache`, async () => {
                providerContext.hold = jest.fn();

                await instance.load(`foo`, undefined);

                expect(providerContext.hold).toBeCalledWith(provider);
            });

            it(`should release the hold on the provider on dispose`, async () => {
                providerContext.hold = jest.fn();
                providerContext.release = jest.fn();
                provider.loadFeature = jest.fn(() => ({})) as any;

                const result = await instance.load(`foo`, undefined);
                await result.dispose();

                expect(providerContext.release).toBeCalledWith(provider);
            });

            it(`should call the original syncronous disposal function if one was supplied`, async () => {
                let disposed = false;

                providerContext.hold = jest.fn();
                providerContext.release = jest.fn();
                provider.loadFeature = jest.fn(() => ({
                    [Symbol.dispose]: () => {
                        disposed = true;
                    }
                })) as any;

                const result = await instance.load(`foo`, undefined);
                result[Symbol.dispose]();

                expect(disposed).toBe(true);
            });
            it(`should call the original asyncronous disposal function if one was supplied`, async () => {
                let disposed = false;

                providerContext.hold = jest.fn();
                providerContext.release = jest.fn();
                provider.loadFeature = jest.fn(() => ({
                    [Symbol.asyncDispose]: () => {
                        disposed = true;
                    }
                })) as any;

                const result = await instance.load(`foo`, undefined);
                await result[Symbol.asyncDispose]();

                expect(disposed).toBe(true);
            });
            it(`should call the original dispose function if one was supplied`, async () => {
                let disposed = false;

                providerContext.hold = jest.fn();
                providerContext.release = jest.fn();
                provider.loadFeature = jest.fn(() => ({
                    dispose: () => {
                        disposed = true;
                    }
                })) as any;

                const result = await instance.load(`foo`, undefined);
                await result.dispose();

                expect(disposed).toBe(true);
            });
        })
    })
});
