import { describe, expect, it, beforeEach } from '@jest/globals';
import { ProviderContext } from './provider-context';
import { EnvironmentContext } from './environment-context';
import { ProviderLoader } from '.';
import { Cachable } from './cache/cache-item';

type ProviderMap = {
    bar: () => Promise<any>;
}

class TestContext extends EnvironmentContext<ProviderMap> {
    load = jest.fn();
    module = jest.fn();
    asyncModule = jest.fn(() => Promise.resolve()) as any;
}

describe(`ProviderContext`, () => {
    let factory: ProviderLoader<ProviderMap[`bar`]>;
    let environmentContext: TestContext;

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
        factory = jest.fn();

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

        environmentContext = new TestContext(config, providers, { foo: `bar` });
        environmentContext.load.mockReturnValue(factory);
    });

    describe(`constructor`, () => {
        it(`should initialize the environment context property`, () => {
            const instance = new ProviderContext<ProviderMap>(environmentContext);

            expect(instance.environmentContext).toBe(environmentContext);
        });
    });

    describe(`instance`, () => {
        let instance: ProviderContext<ProviderMap>;

        beforeEach(() => {
            instance = new ProviderContext(environmentContext);
        });

        describe(`load`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.load).toBe(`function`);
            });

            it(`should call environmentContext to load the specified provider`, async () => {
                await instance.load(`bar`, undefined, {} as any);

                expect(environmentContext.load).toBeCalledWith(`bar`);
            });
            it(`should throw an error if no provider is returned from the environmentContext.load function`, async () => {
                environmentContext.load.mockReturnValue(undefined);

                await expect(instance.load(`bar`, undefined, {} as any)).rejects.toThrow();
            });
            it(`should create the provider with the supplied context and config`, async () => {
                const context = Symbol(`context`);
                const config = Symbol(`config`);

                await instance.load(`bar`, config, context as any);

                expect(factory).toBeCalledWith(context, config);
            });
        });

        describe(`hold`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.hold).toBe(`function`);
            });

            it(`should initialize the held item`, async () => {
                const prov1 = cachable(`test1`);
                await instance.hold(prov1 as any);

                expect(prov1.initialize).toBeCalled();
            });
        });

        describe(`release`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.release).toBe(`function`);
            });

            it(`should dispose the held item`, async () => {
                const prov1 = cachable(`test1`);

                await instance.hold(prov1 as any);
                await instance.release(prov1 as any);

                expect(prov1.dispose).toBeCalled();
            });
        });

        describe(`dispose`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.dispose).toBe(`function`);
            });

            it(`should dispose all providers in the cache`, async () => {
                const prov1 = cachable(`test1`);
                const prov2 = cachable(`test2`);
                const prov3 = cachable(`test3`);

                await instance.hold(prov1 as any);
                await instance.hold(prov2 as any);
                await instance.hold(prov3 as any);

                await instance.dispose();

                expect(prov1.dispose).toBeCalled();
                expect(prov2.dispose).toBeCalled();
                expect(prov3.dispose).toBeCalled();
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

        cachePolicies: jest.fn(() => []),
    };
}