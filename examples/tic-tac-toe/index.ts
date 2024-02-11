import { fileURLToPath } from 'node:url';
import { dirname, basename, extname, join } from 'node:path';
import { EnvironmentContext, FeatureContext, ProviderContext } from '../../src/index.js';
import { ServiceContext } from '../../src/service-context.js';
import { Providers, Services } from '../../src/type.js';
import { initialize, providers } from './environment/node.js';
import { createTicTacToe } from './app/tic-tac-toe.js';
import { EventContext, TicTacToeEvent } from './service/event-context.js';
import { CliService } from './service/cli.js';

export enum SupportedEnvironments {
    node = `node`
}

// TODO: A better way to do this?
export type TicTacToeFeatureContext = FeatureContext<
    typeof providers,
    { cli: CliService },
    EventContext
>;

export interface EnvironmentProvider<TProviders extends Providers, TServices extends Services> {
    environmentContext: EnvironmentContext<TProviders, TServices, EventContext>;
    serviceContext: ServiceContext<TServices, EventContext>;

    start(): Promise<void>;
    stop(): Promise<void>;
}

(async function () {
    if (stripExtension(process.argv[1]) !== stripExtension(fileURLToPath(import.meta.url))) {
        // The script was not run directly.
        return;
    }

    try {
        await run(SupportedEnvironments.node);
    } catch (error) {
        console.error(`An unhandled error occured in run`, error);
        process.exitCode = -1;
    }

    function stripExtension(value: string) {
        const dir = dirname(value);
        const ext = extname(value);
        const base = basename(dir, ext);
        return join(dir, base);
    }
}());

export async function run(environment: SupportedEnvironments) {
    const { environmentContext, serviceContext, start, stop } = await initializeEnvironment(environment);

    const providerContext = new ProviderContext(environmentContext);
    const featureContext = new FeatureContext<
        typeof environmentContext.providers,
        typeof serviceContext.services,
        EventContext
    >(providerContext);

    // TODO: A lot of the downstream components need a TicTacToe provider type... how can we expose this to them?

    const ticTacToe = await createTicTacToe(featureContext);
    serviceContext.on(`event`, (service, context) => {
        if (!context) {
            return;
        }

        switch (context.event) {
            case TicTacToeEvent.moveDown:
                ticTacToe.moveDown();
                break;
            case TicTacToeEvent.moveLeft:
                ticTacToe.moveLeft();
                break;
            case TicTacToeEvent.moveRight:
                ticTacToe.moveRight();
                break;
            case TicTacToeEvent.moveUp:
                ticTacToe.moveUp();
                break;
            case TicTacToeEvent.play:
                ticTacToe.play();
                break;
            case TicTacToeEvent.start:
                ticTacToe.start();
                break;
        }
    });

    start().then(() => {
        setTimeout(() => {
            ticTacToe.moveUp();
        }, 3000);
    });

    return stop;
}

async function initializeEnvironment(environment: SupportedEnvironments) {
    switch (environment) {
        case SupportedEnvironments.node: {
            const env = await initialize();
            return env;
        }
        default:
            throw new Error(`Unsupported environment "${environment}" received`);
    }
}
