import { describe, expect, it, beforeEach } from '@jest/globals';
import { EnvironmentContext } from './environment-context.js';
import { Provider } from './provider.js';
import { ServiceContext } from './service-context.js';
import { Service } from './service.js';

type ProviderMap = {
    bar: () => Promise<Provider<{ foo: () => Promise<any> }>>;
}

class TestContext extends EnvironmentContext<ProviderMap, { baz: Service<any, never, {}> }> { }

describe(`EnvironmentContext`, () => {
    let config: {
        provider: {
            bar: undefined;
        };
        feature: {
            foo: undefined;
        };
        service: {
            baz: {};
        };
    };

    let fooFeature: {};
    let features: {
        foo: () => Promise<typeof fooFeature>
    };
    let barProvider: Provider<typeof features>;
    let providers: ProviderMap;
    let services: {
        baz: Service<any, never, {}>;
    };
    let serviceContext: ServiceContext<typeof services>;

    beforeEach(() => {
        fooFeature = {};
        barProvider = {
            feature: {
                foo: () => Promise.resolve(fooFeature)
            }
        } as Provider<typeof features>;
        services = {
            baz: {} as Service<any, never, {}>
        };
        serviceContext = {
            services
        } as ServiceContext<typeof services>;

        config = {
            provider: {
                bar: undefined,
            },
            feature: {
                foo: undefined,
            },
            service: {
                baz: {},
            },
        };

        providers = {
            bar: () => Promise.resolve(barProvider)
        };
    });

    describe(`constructor`, () => {
        it(`should define the config property`, () => {
            const instance = new TestContext(config, providers, { foo: `bar` }, serviceContext);
            expect(instance.config).toBe(config);
        });

        it(`should define the defaultProviders property`, () => {
            const instance = new TestContext(config, providers, { foo: `bar` }, serviceContext);

            expect(instance.defaultProviders).toEqual({ foo: `bar` });
        });

        it(`should set defaultProviders to an empty object when not supplied`, () => {
            const instance = new TestContext(config, providers, undefined, serviceContext);

            expect(instance.defaultProviders).toEqual(expect.any(Object),);
        });
    })

    describe(`instance`, () => {        
        let instance: TestContext;

        beforeEach(() => {
            instance = new TestContext(config, providers, { foo: `bar` }, serviceContext);
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

        describe(`serviceConfig`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.serviceConfig).toBe(`function`);
            });
            it(`should return the config section for the service`, () => {
                const conf = instance.serviceConfig(undefined!, `baz`) as any;
                expect(conf).toBe(config.service.baz);
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
