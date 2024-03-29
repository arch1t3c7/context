import { describe, expect, it, beforeEach } from '@jest/globals';
import { EventEmitter } from './event-emitter.js';

describe(`EventEmitter`, () => {
    let eventEmitter: EventEmitter;

    beforeEach(() => {
        eventEmitter = new EventEmitter();
    })
    
    describe(`on`, () => {
        it(`should be a function`, () => {
            expect(typeof eventEmitter.on).toBe(`function`);
        });
        it(`should return the number of times the function has been registered`, () => {
            const handler = () => undefined;

            expect(eventEmitter.on(`test1`, handler)).toBe(1);
            expect(eventEmitter.on(`test2`, handler)).toBe(1);
            expect(eventEmitter.on(`test1`, handler)).toBe(2);
            expect(eventEmitter.on(`test2`, handler)).toBe(2);
        });
    });

    describe(`once`, () => {
        it(`should be a function`, () => {
            expect(typeof eventEmitter.once).toBe(`function`);
        });
        it(`should return the number of times the function has been registered`, () => {
            const handler = () => undefined;

            expect(eventEmitter.once(`test1`, handler)).toBe(1);
            expect(eventEmitter.once(`test2`, handler)).toBe(1);
            expect(eventEmitter.once(`test1`, handler)).toBe(2);
            expect(eventEmitter.once(`test2`, handler)).toBe(2);
        });
        it(`should only execute the handler once`, () => {
            const handler = jest.fn();

            eventEmitter.once(`test`, handler);

            eventEmitter.emit(`test`);
            eventEmitter.emit(`test`);
            eventEmitter.emit(`test`);
            eventEmitter.emit(`test`);

            expect(handler).toBeCalledTimes(1);
        });
        it(`should only remove the handle once executed`, () => {
            const handler = () => undefined;

            eventEmitter.once(`test`, handler);

            eventEmitter.emit(`test`);

            expect(eventEmitter.off(`test`, handler)).toBe(-1);
        });
    });

    describe(`off`, () => {
        it(`should be a function`, () => {
            expect(typeof eventEmitter.on).toBe(`function`);
        });

        it(`should return -1 if the handler has never been previously registered`, () => {
            const handler1 = () => undefined;
            const handler2 = () => undefined;

            expect(eventEmitter.off(`test`, handler1)).toBe(-1);
            eventEmitter.on(`test`, handler1);
            expect(eventEmitter.off(`test`, handler2)).toBe(-1);
        });

        it(`should return the updated handler count if the handler has been previously registered`, () => {
            const handler = () => undefined;

            eventEmitter.on(`test`, handler);
            expect(eventEmitter.off(`test`, handler)).toBe(0);
        });
    });

    describe(`clear`, () => {
        it(`should be a function`, () => {
            expect(typeof eventEmitter.clear).toBe(`function`);
        });

        it(`should remove all previously registered handlers`, () => {
            const handler = () => undefined;

            eventEmitter.on(`test1`, handler);
            eventEmitter.on(`test2`, handler);

            eventEmitter.clear(`test2`);

            expect(eventEmitter.off(`test1`, handler)).toBe(0);
            expect(eventEmitter.off(`test2`, handler)).toBe(-1);
        });

        it(`should return the number of handlers cleared`, () => {
            const handler = () => undefined;

            eventEmitter.on(`test1`, handler);
            eventEmitter.on(`test1`, handler);
            eventEmitter.on(`test2`, handler);

            expect(eventEmitter.clear(`test1`)).toBe(2);
            expect(eventEmitter.clear(`test2`)).toBe(1);
            expect(eventEmitter.clear(`something else`)).toBe(0);
        });
    });

    describe(`emit`, () => {
        it(`should be a function`, () => {
            expect(typeof eventEmitter.emit).toBe(`function`);
        });

        it(`should call all handlers registered with the supplied name`, () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            eventEmitter.on(`test`, handler1);
            eventEmitter.on(`test`, handler2);

            eventEmitter.emit(`test`);

            expect(handler1).toHaveBeenCalled();
            expect(handler2).toHaveBeenCalled();
        });
        it(`should not call any handlers not registered with the supplied name`, () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();

            eventEmitter.on(`test`, handler1);
            eventEmitter.on(`test`, handler2);

            eventEmitter.emit(`another name`);

            expect(handler1).not.toHaveBeenCalled();
            expect(handler2).not.toHaveBeenCalled();
        });
        it(`should return the number of handlers registered with the name`, () => {
            const handler = () => undefined;

            eventEmitter.on(`test`, handler);
            eventEmitter.on(`test`, handler);

            expect(eventEmitter.emit(`test`)).toBe(2);
        });
        it(`should pass the supplied arguments to the registered handlers`, () => {
            const handler = jest.fn();
            const args = [Symbol(`arg1`), Symbol(`arg2`)];

            eventEmitter.on(`test`, handler);
            eventEmitter.emit(`test`, ...args);

            expect(handler).toBeCalledWith(...args);
        });
    });
});