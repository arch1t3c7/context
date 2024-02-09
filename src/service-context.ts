import type { Services } from './type';

export class ServiceContext<TServices extends Services> {
    services: TServices;

    constructor(services: TServices) {
        this.services = services;
    }

    async stop() {
        const wait: Promise<void>[] = [];

        for (const service of Object.values(this.services)) {
             wait.push(service.stop());
        }

        await Promise.all(wait);
    }
}
