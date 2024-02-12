import { ProgramError } from './error/program.js';
import { FeatureContext } from './feature-context.js';
import { Service, ServiceEvent } from './service.js';
import type { Providers, Features, ProviderConfig, StringKeys, DefaultProviders, Services, FeatureTypeConfig, ProviderTypeConfig, EnvironmentContextEventHandler, AnyFunc } from './type.js';
import { EventEmitter } from './util/event-emitter.js';

export class EnvironmentContext<
    TProviders extends Providers,
    TServices extends Services | void = void,
    TEventContext = void
> extends EventEmitter<`event`, EnvironmentContextEventHandler<TProviders, TServices, TEventContext>, [StringKeys<TServices>, TEventContext?]> {
    /** Holds the event handlers for the services */
    #onEventListeners = new Map<StringKeys<TServices>, AnyFunc>;

    /** Whether start has been called */
    #started = false;

    /** The base config for the environment */
    config: ProviderConfig<TProviders> | void;

    /** The default provider for the features */
    defaultProviders: DefaultProviders<TProviders>;

    /** The default providers for features */
    providers: TProviders;

    /** The services for the environment */
    services?: TServices;

    /** Gets whether start has been called or not */
    get started() {
        return this.#started;
    }

    /** Creates a new environment context */
    constructor(
        config: ProviderConfig<TProviders> | void,
        providers: TProviders,
        defaultProviders?: DefaultProviders<TProviders>,

    ) {
        super();
        this.config = config;
        this.providers = providers;
        this.defaultProviders = defaultProviders ||
            {};
    }

    /** Returns the base configuration for the provider */
    providerConfig<KProvider extends StringKeys<TProviders>>(
        context: FeatureContext<TProviders, TServices, TEventContext>,
        provider: KProvider,
        feature: StringKeys<Features<TProviders>>,
    ): ProviderTypeConfig<TProviders, KProvider> | Promise<ProviderTypeConfig<TProviders, KProvider>> {
        // Return the default provider config for the environment
        return this.config?.provider?.[provider];
    }

    /** Returns the base configuration for the feature */
    featureConfig<KFeature extends StringKeys<Features<TProviders>>> (
        context: FeatureContext<TProviders, TServices, TEventContext>,
        provider: StringKeys<TProviders>,
        feature: KFeature,
    ): FeatureTypeConfig<TProviders, KFeature> | Promise<FeatureTypeConfig<TProviders, KFeature>> {
        return this.config?.feature?.[feature];
    }

    /** Loads a module directly */
    module<T>(identifier: string): T | undefined {
        return undefined;
    }

    /** Loads a module asynchronously */
    async asyncModule<T>(identifier: string): Promise<T | undefined> {
        return undefined;
    }

    protected async createServices(featureContext: FeatureContext<TProviders>): Promise<TServices | undefined> {
        return undefined;
    }

    /** Starts all services defined by createServices */
    async start(featureContext: FeatureContext<TProviders>) {
        if (this.started) {
            throw new ProgramError(`Start has already been called`);
        }

        if (!this.services) {
            this.services = await this.createServices(featureContext);
        }

        if (!this.services) {
            throw new ProgramError(
                `createServices returned undefined. Start can only work when ` +
                    `createServices returns services`
            );
        }

        const wait: Promise<Service<unknown, unknown, unknown>>[] = [];

        for (const [name, service] of Object.entries(this.services as object)) {
            const handler = (context?: TEventContext) => {
                this.#onEvent(name as StringKeys<TServices>, context);
            };
            this.#onEventListeners.set(name as StringKeys<TServices>, handler);
            service.on(ServiceEvent.event, handler);
            wait.push(service.start().then(() => service));
        }

        const results = await Promise.allSettled(wait);

        const succeeded = results.filter((result) => result.status === `fulfilled`);
        const allOk = succeeded.length === wait.length;
        if (allOk) {
            this.#started =  true;
            return;
        }

        // Stop the ones that started succesfully
        wait.length = 0;
        for (const item of succeeded) {
            const { value } = item as PromiseFulfilledResult<Service<unknown, unknown, unknown>>;
            wait.push(value.stop().then(() => value));
        }        
        await Promise.all(wait);
    }

    /** Stops all previously started services */
    async stop() {
        if (!this.started) {
            throw new ProgramError(`Stop can only be called once start is called`);
        }

        const wait: Promise<void>[] = [];

        for (const [name, service] of Object.entries(this.services as object)) {
            const handler = this.#onEventListeners.get(name as StringKeys<TServices>);
            if (handler) {
                service.off(ServiceEvent.event, handler);
                this.#onEventListeners.delete(name as StringKeys<TServices>);
            }
            wait.push(service.stop());
        }

        await Promise.all(wait);

        this.#started =  false;
    }

    #onEvent(service: StringKeys<TServices>, context?: TEventContext) {
        this.emit(`event`, service, context);
    }
}
