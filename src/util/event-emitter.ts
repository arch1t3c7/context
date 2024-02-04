/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyFunc } from '../type';

export class EventEmitter<TEvent = string> {
    #handlers = new Map<TEvent, AnyFunc[]>;

    on(event: TEvent, handler: AnyFunc) {
        let handlers = this.#handlers.get(event);
        if (!handlers) {
            handlers = [];
            this.#handlers.set(event, handlers);
        }
        handlers.push(handler);
        return handlers.filter((val) => val === handler).length;
    }

    off(event: TEvent, handler: AnyFunc) {
        const handlers = this.#handlers.get(event);
        if (!handlers) {
            return false;
        }

        const handlerIndex = handlers.indexOf(handler);
        if (handlerIndex === -1) {
            return false;
        }

        handlers.splice(handlerIndex, 1);
        return true;
    }

    clear(event: TEvent) {
        const handlers = this.#handlers.get(event);
        if (!handlers) {
            return 0;
        }
        this.#handlers.delete(event);
        return handlers.length;
    }

    emit(event: TEvent, ...args: any[]) {
        const handlers = this.#handlers.get(event);
        
        if (!handlers) {
            return 0;
        }

        for (const handler of handlers) {
            handler.call(this, ...args);
        }

        return handlers.length;
    }
}
