/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceEvent } from './service.js';
import type { AnyFunc, ServiceContextEventHandler, Services, StringKeys } from './type.js';
import { EventEmitter } from './util/event-emitter.js';

export class ServiceContext<
    TServices extends Services,
    TEventContext = void
> extends EventEmitter<`event`, ServiceContextEventHandler<TServices, TEventContext>, [StringKeys<TServices>, TEventContext?]> {
    services: TServices;

    #onEventListeners = new Map<StringKeys<TServices>, AnyFunc>;

    constructor(services: TServices) {
        super();
        this.services = services;
    }

    async start() {
        const wait: Promise<void>[] = [];

        for (const [name, service] of Object.entries(this.services)) {
            const handler = (context?: TEventContext) => {
                this.#onEvent(name as StringKeys<TServices>, context);
            };
            this.#onEventListeners.set(name as StringKeys<TServices>, handler);
            service.on(ServiceEvent.event, handler);
            wait.push(service.start());
        }

        await Promise.all(wait);
    }

    async stop() {
        const wait: Promise<void>[] = [];

        for (const [name, service] of Object.entries(this.services)) {
            const handler = this.#onEventListeners.get(name as StringKeys<TServices>);
            if (handler) {
                service.off(ServiceEvent.event, handler);
                this.#onEventListeners.delete(name as StringKeys<TServices>);
            }
            wait.push(service.stop());
        }

        await Promise.all(wait);
    }

    #onEvent(service: StringKeys<TServices>, context?: TEventContext) {
        this.emit(`event`, service, context);
    }
}
