import { describe, expect, it, beforeEach } from '@jest/globals';
import { EnvironmentContext } from './environment-context.js';
import { Provider } from './provider.js';
import { FeatureContext } from './feature-context.js';
import { Service, ServiceEvent } from './service.js';
import { EventEmitter } from './util/event-emitter.js';
import { Deferred } from './util/deferred.js';

type ProviderMap = {
    bar: () => Promise<Provider<{ foo: () => Promise<any> }>>;
}

class TestContext extends EnvironmentContext<ProviderMap, void> {
    protected createServices(featureContext: FeatureContext<ProviderMap, void, void>): Promise<void> {
        throw new Error('Method not implemented.');
    }   
}



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
            const instance = new TestContext(config, providers, { foo: `bar` });
            expect(instance.config).toBe(config);
        });

        it(`should define the defaultProviders property`, () => {
            const instance = new TestContext(config, providers, { foo: `bar` });

            expect(instance.defaultProviders).toEqual({ foo: `bar` });
        });

        it(`should set defaultProviders to an empty object when not supplied`, () => {
            const instance = new TestContext(config, providers, undefined);

            expect(instance.defaultProviders).toEqual(expect.any(Object),);
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

            it(`should return undefined if no config exists for the provider`, () => {
                instance = new TestContext({ provider: undefined }, providers, { foo: `bar` });
                let conf = instance.providerConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);

                instance = new TestContext({ }, providers, { foo: `bar` });
                conf = instance.providerConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);

                instance = new TestContext(undefined, providers, { foo: `bar` });
                conf = instance.providerConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);
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

            it(`should return undefined if no config exists for the feauture`, () => {
                instance = new TestContext({ feature: undefined }, providers, { foo: `bar` });
                let conf = instance.featureConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);

                instance = new TestContext({ }, providers, { foo: `bar` });
                conf = instance.featureConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);

                instance = new TestContext(undefined, providers, { foo: `bar` });
                conf = instance.featureConfig(undefined!, `bar`, `foo`) as any;
                expect(conf).toBe(undefined);
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

        describe(`services`, () => {
            let instance: TestServicesContext;
            let bazService: Service<any, any, any>;
            let fooService: Service<any, any, any>;
            let eventHandler: jest.Mock<any, any, any>;
            let services: {
                baz: Service<any, any, any>;
                foo: Service<any, any, any>;
            } | undefined;

            class TestServicesContext extends EnvironmentContext<ProviderMap, { baz: Service<any, any, any> }> {
                protected async createServices(featureContext: FeatureContext<ProviderMap, void, void>) {
                    super.createServices(featureContext); // For coverage
                    return services;
                }
            }

            beforeEach(() => {
                bazService = new EventEmitter() as any;
                bazService.start = jest.fn(() => Promise.resolve());
                bazService.stop = jest.fn(() => Promise.resolve());

                fooService = new EventEmitter() as any;
                fooService.start = jest.fn(() => Promise.resolve());
                fooService.stop = jest.fn(() => Promise.resolve());
                services = {
                    baz: bazService,
                    foo: fooService,
                }

                instance = new TestServicesContext(config, providers, { foo: `bar` });
                eventHandler = jest.fn();
            })

            describe(`start`, () => {
                it(`should be a function`, () => {
                    expect(typeof instance.stop).toBe(`function`);
                });
    
                it(`call start on all services`, async () => {
                    await instance.start(undefined!);
                    expect(bazService.start).toBeCalled();
                });

                it(`should throw an error if createServices returns undefined`, async () => {
                    services = undefined;
                    await expect(instance.start(undefined!)).rejects.toThrow();
                });

                it(`should throw an error if start was previously called`, async () => {
                    await instance.start(undefined!);
                    await expect(instance.start(undefined!)).rejects.toThrow();
                });

                it(`should stop all succesfull started services if any service fails to start`, async () => {
                    const deferred = new Deferred();

                    fooService.start = jest.fn(() => deferred.promise);

                    instance.start(undefined!);

                    // Give the internal promises a chance to resolve
                    await new Promise((res) => setTimeout(res, 0));

                    expect(bazService.start).toBeCalledTimes(1);
                    expect(fooService.start).toBeCalledTimes(1);

                    deferred.reject(new Error(`Fake error`));

                    // Give the internal promises a chance to resolve
                    await new Promise((res) => setTimeout(res, 0));

                    expect(bazService.stop).toBeCalledTimes(1);
                });
            });
    
            describe(`stop`, () => {
                it(`should be a function`, () => {
                    expect(typeof instance.stop).toBe(`function`);
                });
    
                it(`call stop on all services`, async () => {
                    bazService.stop = jest.fn();
    
                    await instance.start(undefined!);
                    await instance.stop();
    
                    expect(bazService.stop).toBeCalled();
                });

                it(`should throw an error if the service is not started`, async () => {
                    await expect(instance.stop()).rejects.toThrow();
                });
            });
    
            describe(`events`, () => {
                beforeEach(async () => {
                    instance.on(`event`, eventHandler);
                    await instance.start(undefined!);
                });
    
                afterEach(async () => {
                    await instance.stop();
                });
    
                it(`should emit "event" when any service emits "event" with the same parameters passed by the service prepended by the service name`, () => {
                    expect(eventHandler).not.toBeCalled();
    
                    const context = {};
                    expect(bazService.emit(ServiceEvent.event, context)).toBe(1);
    
                    expect(eventHandler).toBeCalledWith(`baz`, context);
                });
            });
        })

        
    });
});
