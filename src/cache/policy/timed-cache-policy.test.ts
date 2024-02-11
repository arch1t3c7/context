import { describe, expect, it } from '@jest/globals';
import { TimedCachePolicy } from './timed-cache-policy.js';
import { CacheItem } from '../cache-item.js';
import { HoldableEvent } from '../../util/holdable.js';

describe(`TimedCachePolicy`, () => {
    const time = 1000;
    let instance: TimedCachePolicy<string>;

    beforeEach(() => {
        jest.spyOn(global, 'setTimeout');
        jest.spyOn(global, 'clearTimeout');
        // jest.useFakeTimers();
        instance = new TimedCachePolicy({ time });
    });

    afterEach(() => {
        // jest.useRealTimers();
    });

    describe(`onHold`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.onHold).toBe(`function`);
        });

        it(`should place a hold on the item`, () => {
            const item = cacheItem(`test`);

            expect(item.count).toBe(0);
            instance.onHold(item);
            expect(item.count).toBe(1);
        });

        describe(`events`, () => {
            it(`should add a "${HoldableEvent.held}" event handler to the item`, () => {
                const item = cacheItem(`test`);
                item.on = jest.fn();

                instance.onHold(item);

                expect(item.on).toBeCalledWith(HoldableEvent.held, expect.any(Function));
            });

            it(`should add a "${HoldableEvent.released}" event handler to the item`, () => {
                const item = cacheItem(`test`);
                item.on = jest.fn();

                instance.onHold(item);

                expect(item.on).toBeCalledWith(HoldableEvent.released, expect.any(Function));
            });

            it(`should not add a timeout when a "${HoldableEvent.released}" event occurs and their are additional holds on the item`, () => {
                const item = cacheItem(`test`);

                instance.onHold(item);
                item.hold();

                item.emit(HoldableEvent.released);
                expect(global.setTimeout).not.toBeCalled();
            });

            it(`should add a timeout when a "${HoldableEvent.released}" event occurs and their are no additional holds on the item`, () => {
                const item = cacheItem(`test`);

                instance.onHold(item);

                item.emit(HoldableEvent.released, 1);
                expect(global.setTimeout).toBeCalled();
            });

            it(`should clear the timeout when a "${HoldableEvent.held}" event occurs`, () => {
                const item = cacheItem(`test`);

                instance.onHold(item);
                item.emit(HoldableEvent.released, 1);
                item.emit(HoldableEvent.held, 1);

                expect(global.clearTimeout).toBeCalled();
            });

            it.each`
                event
                ${HoldableEvent.held}
                ${HoldableEvent.released}
            `(`should remove the "$event" event when the timer expires`, ({ event }) => {
                const item = cacheItem(`test`);

                jest.useFakeTimers();

                try {
                    instance.onHold(item);
                    const oldOff = item.off as any;
                    item.off = jest.fn((...args: any[]) => oldOff.call(item, ...args) as any);
                    item.emit(HoldableEvent.released);

                    jest.advanceTimersByTime(time * 2);

                    expect(item.off).toBeCalledWith(event, expect.any(Function));
                } finally {
                    jest.useRealTimers();
                }
            })

            it(`should release the item when the timer expires`, () => {
                const item = cacheItem(`test`);

                jest.useFakeTimers();

                try {
                    instance.onHold(item);
                    item.emit(HoldableEvent.released);

                    expect(item.count).toBe(1);
                    jest.advanceTimersByTime(time * 2);
                    expect(item.count).toBe(0);
                } finally {
                    jest.useRealTimers();
                }
            });
        });
    });

    describe(`onHit`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.onHit).toBe(`function`);
        });

        it(`should clear the timeout`, () => {
            const item = cacheItem(`test`);

            instance.onHold(item);
            item.emit(HoldableEvent.released, 1);
            instance.onHit(item);

            expect(global.clearTimeout).toBeCalled();
        });
    });

    describe(`dispose`, () => {
        it(`should be a function`, () => {
            expect(typeof instance.dispose).toBe(`function`);
        });

        it(`should clear all timeouts`, () => {
            const item = cacheItem(`test`);

            instance.onHold(item);
            item.emit(HoldableEvent.released);
            instance.dispose();

            expect(global.clearTimeout).toBeCalled();
        });
    });
});

function cacheItem(key: string) {
    return new CacheItem({
        name: `test`,
        cacheKey: key,
        cachePolicies: () => []
    });
}
