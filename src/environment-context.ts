import { FeatureContext } from './feature-context.js';
import { ServiceContext } from './service-context.js';
import type { Providers, Features, ProviderConfig, StringKeys, DefaultProviders, Services } from './type.js';

export class EnvironmentContext<TProviders extends Providers, TServices extends Services | void = void, TEventContext = void> {
    /** The base config for the environment */
    config: ProviderConfig<TProviders> | void;

    /** The default provider for the features */
    defaultProviders: DefaultProviders<TProviders>;

    /** The default providers for features */
    providers: TProviders;

    /** The available services */
    serviceContext?: TServices extends Services ?
        ServiceContext<TServices, TEventContext> :
        undefined;

    /** Creates a new environment context */
    constructor(
        config: ProviderConfig<TProviders>,
        providers: TProviders,
        defaultProviders?: DefaultProviders<TProviders>,
        serviceContext?: TServices extends Services ?
            ServiceContext<TServices, TEventContext> :
            undefined,
    ) {
        this.config = config;
        this.providers = providers;
        this.defaultProviders = defaultProviders ||
            {};
        this.serviceContext = serviceContext;
    }

    /** Returns the base configuration for the provider */
    providerConfig(
        context: FeatureContext<TProviders, TServices, TEventContext>,
        provider: StringKeys<TProviders>,
        feature: StringKeys<Features<TProviders>>,
    ): unknown | Promise<unknown> {
        // Return the default provider config for the environment
        return this.config?.provider?.[provider];
    }

    /** Returns the base configuration for the feature */
    featureConfig(
        context: FeatureContext<TProviders, TServices, TEventContext>,
        provider: StringKeys<TProviders>,
        feature: StringKeys<Features<TProviders>>,
    ): unknown | Promise<unknown> {
        return this.config?.feature?.[feature];
    }

    /** Loads a module directly */
    module<T>(): T | undefined {
        return undefined;
    }

    /** Loads a module asynchronously */
    async asyncModule<T>(): Promise<T | undefined> {
        return undefined;
    }
}
