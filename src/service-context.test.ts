import { describe, expect, it, beforeEach } from '@jest/globals';
import { ServiceContext } from './service-context.js';
import { Service, ServiceEvent } from './service.js';

describe(`ServiceContext`, () => {
    describe(`constructor`, () => {
        it(`should initialize the "services" property`, () => {
            const services = {};
            const instance = new ServiceContext(services);

            expect(instance.services).toBe(services);
        });
    });

    describe(`instance`, () => {
        let eventContext: {};
        let services: {
            foo: Service<typeof eventContext>
        };
        let instance: ServiceContext<typeof services>;
        let eventHandler: jest.Mock<any, any, any>;

        beforeEach(() => {
            eventHandler = jest.fn();
            services = {
                foo: new Service<typeof eventContext>(undefined),
            };

            instance = new ServiceContext(services);
            instance.on(`event`, eventHandler);
        });

        describe(`start`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.stop).toBe(`function`);
            });

            it(`call start on all services`, async () => {
                services.foo.start = jest.fn();

                await instance.start();

                expect(services.foo.start).toBeCalled();
            });
        });

        describe(`stop`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.stop).toBe(`function`);
            });

            it(`call stop on all services`, async () => {
                services.foo.stop = jest.fn();

                await instance.stop();

                expect(services.foo.stop).toBeCalled();
            });
        });

        describe(`events`, () => {
            beforeEach(async () => {
                await instance.start();
            });

            afterEach(async () => {
                await instance.stop();
            });

            it(`should emit "event" when any service emits "event" with the same parameters passed by the service prepended by the service name`, () => {
                expect(eventHandler).not.toBeCalled();

                const context = {};
                expect(services.foo.emit(ServiceEvent.event, context)).toBe(1);

                expect(eventHandler).toBeCalledWith(`foo`, context);
            });
        });
    });
});
