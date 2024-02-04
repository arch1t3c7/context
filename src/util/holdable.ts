import { EventEmitter } from './event-emitter';

export enum HoldableEvent {
    held = `held`,
    released = `released`,
}

export class Holdable<THeld, TEvent = never> extends EventEmitter<TEvent | HoldableEvent> {
    readonly held: THeld;
    #count = 0;

    get count() {
        return this.#count;
    }

    constructor(held: THeld) {
        super();
        this.held = held;
    }

    hold() {
        this.#count++;
        this.emit(HoldableEvent.held, this.count);
    }

    release() {
        this.#count--;

        if (this.count < 0) {
            throw new Error(`Holdable error. Released too many timed`);
        }

        this.emit(HoldableEvent.released, this.count);
    }
}
