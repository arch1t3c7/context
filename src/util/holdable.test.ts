import { describe, expect, it } from '@jest/globals';
import { Holdable, HoldableEvent } from './holdable';

describe(`Holdable`, () => {
    describe(`constructor`, () => {
        it(`should assign the held property`, () => {
            const held = {};
            const instance = new Holdable(held);

            expect(instance.held).toBe(held);
        });

        it(`should initialize the count property`, () => {
            const instance = new Holdable({});

            expect(instance.count).toBe(0);
        })
    });

    describe(`instance`, () => {
        let instance: Holdable<unknown>;

        beforeEach(() => {
            instance = new Holdable({});
        });

        describe(`hold`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.hold).toBe(`function`);
            });

            it(`should increment the count`, () => {
                expect(instance.count).toBe(0);

                instance.hold();
                expect(instance.count).toBe(1);

                instance.hold();
                expect(instance.count).toBe(2);
            });

            it(`should emit a "${HoldableEvent.held}" event`, () => {
                let receivedEvent = false;

                instance.on(HoldableEvent.held, () => {
                    receivedEvent = true;
                });
                instance.hold();

                expect(receivedEvent).toBe(true);
            });
        });

        describe(`release`, () => {
            it(`should be a function`, () => {
                expect(typeof instance.release).toBe(`function`);
            });

            it(`should decrement the count`, () => {
                instance.hold();
                instance.hold();
                instance.hold();
                expect(instance.count).toBe(3);

                instance.release();
                expect(instance.count).toBe(2);

                instance.release();
                expect(instance.count).toBe(1);
            });

            it(`should emit a "${HoldableEvent.released}" event`, () => {
                let receivedEvent = false;

                instance.hold();
                instance.on(HoldableEvent.released, () => {
                    receivedEvent = true;
                });
                instance.release();

                expect(receivedEvent).toBe(true);
            });

            it(`should throw if called more times than hold`, () => {
                instance.hold();
                instance.hold();
                instance.hold();

                instance.release();
                instance.release();
                instance.release();

                let flag = false;
                try {
                    instance.release();
                    flag = true;
                } catch (error) {
                    // Swallow
                }

                expect(flag).toBe(false);
            });
        });
    });
});