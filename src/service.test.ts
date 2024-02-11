import { describe, expect, it, beforeEach } from '@jest/globals';
import { Service, ServiceEvent } from './service.js';

describe(`Service`, () => {
    describe(`constructor`, () => {
        it(`should initialize the "name" property`, () => {
            const instance = new Service<{}>();

            expect(instance.name).toBe(Service.name);
        });
    });

    describe(`instance`, () => {
        let eventContext: {};
        let instance: Service<typeof eventContext>;

        beforeEach(() => {
            instance = new Service<typeof eventContext>();
        });

        describe(`start`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.start).toBe(`function`);
            });

            it(`should set running to true`, async () => {
                expect(instance.running).toBe(false);

                await instance.start();

                expect(instance.running).toBe(true);
            });
            it(`should emit the "start" event`, async () => {
                const handler = jest.fn();
                instance.on(ServiceEvent.start, handler);

                await instance.start();

                expect(handler).toBeCalled();
            });
        });

        describe(`stop`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.stop).toBe(`function`);
            });

            it(`should set running to false`, async () => {
                await instance.start();
                expect(instance.running).toBe(true);

                await instance.stop();
                expect(instance.running).toBe(false);
            });
            it(`should emit the "stop" event`, async () => {
                const handler = jest.fn();
                instance.on(ServiceEvent.stop, handler);
                await instance.start();

                await instance.stop();

                expect(handler).toBeCalled();
            });
        });

        describe(`on`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.on).toBe(`function`);
            });

            it(`should call the handler on next tick if the server is running and the event is "start"`, async () => {
                const handler = jest.fn();
                await instance.start();

                instance.on(ServiceEvent.start, handler);
                await new Promise((res) => setTimeout(res, 0));

                expect(handler).toBeCalled();
            });
            it(`should call the handler on next tick if the server is not running, has previously been started and the event is "stop"`, async () => {
                const handler = jest.fn();
                await instance.start();
                await instance.stop();

                instance.on(ServiceEvent.stop, handler);
                await new Promise((res) => setTimeout(res, 0));

                expect(handler).toBeCalled();
            });
        });

        describe(`once`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.once).toBe(`function`);
            });

            it(`should call the handler on next tick if the server is running and the event is "start"`, async () => {
                const handler = jest.fn();
                await instance.start();

                instance.once(ServiceEvent.start, handler);
                await new Promise((res) => setTimeout(res, 0));

                expect(handler).toBeCalled();
            });

            it(`should call the handler on next tick if the server is not running, has previously been started and the event is "stop"`, async () => {
                const handler = jest.fn();
                await instance.start();
                await instance.stop();

                instance.once(ServiceEvent.stop, handler);
                await new Promise((res) => setTimeout(res, 0));

                expect(handler).toBeCalled();
            });

            it(`should not call the handler on next tick if the server is running and the event is not "start"`, async () => {
                const handler = jest.fn();
                await instance.start();

                instance.once(ServiceEvent.stop, handler);
                await new Promise((res) => setTimeout(res, 0));

                expect(handler).not.toBeCalled();
            });
        });
    });
});
