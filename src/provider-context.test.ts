import { describe, expect, it, beforeEach } from '@jest/globals';
import { ProviderContext } from './provider-context.js';
import { EnvironmentContext } from './environment-context.js';
import { Cachable } from './cache/cache-item.js';
import { Provider } from './provider.js';

type ProviderMap = {
    bar: () => Promise<Provider<{ foo: () => Promise<any> }>>;
}

class TestContext extends EnvironmentContext<ProviderMap> {
    module = jest.fn();
    asyncModule = jest.fn(() => Promise.resolve()) as any;
}

describe(`ProviderContext`, () => {
    let environmentContext: TestContext;

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

        environmentContext = new TestContext(config, providers, { foo: `bar` });
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