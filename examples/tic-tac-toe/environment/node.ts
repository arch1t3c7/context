import { EnvironmentContext } from '../../../src/environment-context.js';
import { ServiceContext } from '../../../src/service-context.js';
import { EnvironmentProvider } from '../index.js';
import { LocalProvider } from '../provider/local/index.js';
import { ShellProvider } from '../provider/shell/index.js';
import { CliService } from '../service/cli.js';
import { EventContext } from '../service/event-context.js';

export const providers = {
    local: () => Promise.resolve(new LocalProvider()),
    shell: () => Promise.resolve(new ShellProvider()),
};

export class NodeEnvironmentContext extends EnvironmentContext<typeof providers, { cli: CliService }, EventContext> {
    constructor() {
        super({}, providers, {
            'board': `local`,
            'layout': `local`,

            'ascii': `shell`,
            'console': `shell`,
            'render': `shell`,
        });
    }
}

export async function initialize(): Promise<EnvironmentProvider<typeof providers, { cli: CliService }>> {
    const cli = new CliService();
    const services = { cli };

    const serviceContext = new ServiceContext<typeof services, EventContext>(services);
    const environmentContext = new NodeEnvironmentContext();

    let closing = false;
    return {
        serviceContext,
        environmentContext,

        async start() {
            process.on(`SIGTERM`, close);
            await serviceContext.start();
        },

        async stop() {
            await close();
        }
    };

    async function close() {
        if (closing) {
            process.exit();
        }
        closing = true;
        await serviceContext.stop();
        process.exit();
    }
}
