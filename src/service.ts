import type { ServiceEventHandler } from './type';
import { EventEmitter } from './util/event-emitter';

export enum ServiceEvent {
    start = `start`,
    stop = `stop`,
    event = `event`,
}

export class Service<TEventContext, TEvents = never> extends EventEmitter<ServiceEvent | TEvents, ServiceEventHandler<TEventContext>> {
    readonly name: string;

    #running = false;
    #started = false;

    constructor() {
        super();
        this.name = this.constructor.name;
    }

    get running() {
        return this.#running;
    }

    async start() {
        this.#running = true;
        this.#started = true;
        this.emit(ServiceEvent.start);
    }

    async stop() {
        this.#running = false;
        this.emit(ServiceEvent.stop);
    }

    on(event: ServiceEvent, handler: ServiceEventHandler<TEventContext, TEvents>): number {
        this.#instantEvent(event, handler);
        return super.on(event, handler);
    }

    once(event: ServiceEvent, handler: ServiceEventHandler<TEventContext, TEvents>): number {
        if (this.#instantEvent(event, handler)) {
            return 0;
        }
        return super.once(event, handler);
    }

    #instantEvent(event: ServiceEvent, handler: ServiceEventHandler<TEventContext, TEvents>) {
        switch (event) {
            case ServiceEvent.start:
                if (this.#running === true) {
                    setTimeout(() => handler.call(this), 0);
                    return true;
                }
                break;
            case ServiceEvent.stop:
                if (this.#running === false && this.#started === true) {
                    setTimeout(() => handler.call(this), 0);
                    return true;
                }
                break;
        }
        return false;
    }
}
