import type { ServiceEventHandler } from './type.js';
import { EventEmitter } from './util/event-emitter.js';

export enum ServiceEvent {
    start = `start`,
    stop = `stop`,
    event = `event`,
}

export class Service<TEventContext, TEvents = never, TConfig = void> extends EventEmitter<ServiceEvent | TEvents, ServiceEventHandler<TEventContext>> {
    readonly name: string;

    config: TConfig;

    #running = false;
    #started = false;

    constructor(config: TConfig) {
        super();
        this.name = this.constructor.name;
        this.config = config;
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

    emit(event: TEvents | ServiceEvent, context?: TEventContext): number {
        return super.emit(event, context);
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
