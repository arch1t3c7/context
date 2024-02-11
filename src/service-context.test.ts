import { describe, expect, it, beforeEach } from '@jest/globals';
import { ServiceContext } from './service-context.js';
import { Service } from './service.js';

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

        beforeEach(() => {
            services = {
                foo: new Service<typeof eventContext>(),
            };

            instance = new ServiceContext(services);
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
    });
});
