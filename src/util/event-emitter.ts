/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnyFunc } from '../type';

export class EventEmitter<TEvent = string, THandler extends AnyFunc = AnyFunc, TArgs extends any[] = any[]> {
    #handlers = new Map<TEvent, { once: boolean, handler: THandler }[]>;

    on(event: TEvent, handler: THandler) {
        return this.#on(event, handler, false);
    }

    once(event: TEvent, handler: THandler) {
        return this.#on(event, handler, true);
    }

    off(event: TEvent, handler: THandler) {
        const handlers = this.#handlers.get(event);
        if (!handlers) {
            return -1;
        }

        const handlerIndex = handlers.findIndex(({ handler: hand }) => hand === handler);
        if (handlerIndex === -1) {
            return -1;
        }

        handlers.splice(handlerIndex, 1);
        return handlers.length;
    }

    clear(event: TEvent) {
        const handlers = this.#handlers.get(event);
        if (!handlers) {
            return 0;
        }
        this.#handlers.delete(event);
        return handlers.length;
    }

    emit(event: TEvent, ...args: TArgs) {
        const handlers = this.#handlers.get(event);
        
        if (!handlers) {
            return 0;
        }

        for (let index = 0; index < handlers.length; index++) {
            const { handler, once } = handlers[index];
            if (once) {
                handlers.splice(index, 1);
                index--;
            }
            handler.call(this, ...args);
        }

        if (handlers.length === 0) {
            this.#handlers.delete(event);
        }

        return handlers.length;
    }

    #on(event: TEvent, handler: THandler, once: boolean) {
        let handlers = this.#handlers.get(event);
        if (!handlers) {
            handlers = [];
            this.#handlers.set(event, handlers);
        }
        handlers.push({ handler, once });
        return handlers.filter((val) => val.handler === handler).length;
    }
}
