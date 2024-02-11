import { FeatureContext } from './feature-context.js';
import { ServiceContext } from './service-context.js';
import type { Providers, Features, ProviderConfig, StringKeys, DefaultProviders, Services } from './type.js';

export class EnvironmentContext<TProviders extends Providers, TServices extends Services | void = void, TEventContext = void> {
    /** The base config for the environment */
    config: ProviderConfig<TProviders, TServices> | void;

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
        config: ProviderConfig<TProviders, TServices>,
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
        /* c8 ignore start */
        // Return the default provider config for the environment
        return this.config?.provider?.[provider];
        /* c8 ignore end */
    }

    /** Returns the base configuration for the feature */
    featureConfig(
        context: FeatureContext<TProviders, TServices, TEventContext>,
        provider: StringKeys<TProviders>,
        feature: StringKeys<Features<TProviders>>,
    ): unknown | Promise<unknown> {
        /* c8 ignore start */
        return this.config?.feature?.[feature];
        /* c8 ignore end */
    }

    /** Returns the configuration for the service */
    serviceConfig(
        context: FeatureContext<TProviders, TServices, TEventContext>,
        service: TServices extends Services ? StringKeys<TServices> : never,
    ): unknown | Promise<unknown> {
        /* c8 ignore start */
        return this.config?.service?.[service];
        /* c8 ignore end */
    }

    /** Loads a module directly */
    module<T>(identifier: string): T | undefined {
        return undefined;
    }

    /** Loads a module asynchronously */
    async asyncModule<T>(identifier: string): Promise<T | undefined> {
        return undefined;
    }
}
