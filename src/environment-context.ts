import { FeatureContext } from './index';
import { ServiceContext } from './service-context';
import type { ProviderLoader, Providers, Features, ProviderConfig, StringKeys, DefaultProviders, Services } from './type';

export abstract class EnvironmentContext<TProviders extends Providers, TServices extends Services | void = void> {
    /** The base config for the environment */
    config: ProviderConfig<TProviders> | void;

    /** The default provider for the features */
    defaultProviders: DefaultProviders<TProviders>;

    /** The default providers for features */
    providers: TProviders;

    /** The available services */
    serviceContext?: TServices extends Services ?
        ServiceContext<TServices> :
        undefined;

    /** Creates a new environment context */
    constructor(
        config: ProviderConfig<TProviders>,
        providers: TProviders,
        defaultProviders?: DefaultProviders<TProviders>,
        serviceContext?: TServices extends Services ?
            ServiceContext<TServices> :
            undefined,
    ) {
        this.config = config;
        this.providers = providers;
        this.defaultProviders = defaultProviders ||
            {};
        this.serviceContext = serviceContext;
    }

    /** The provider module loader */
    abstract load<TProvider>(provider: StringKeys<TProviders>): Promise<ProviderLoader<TProvider>>;

    /** Returns the base configuration for the provider */
    providerConfig(
        context: FeatureContext<TProviders, TServices>,
        provider: StringKeys<TProviders>,
        feature: StringKeys<Features<TProviders>>,
    ): unknown | Promise<unknown> {
        // Return the default provider config for the environment
        return this.config?.provider?.[provider];
    }

    /** Returns the base configuration for the feature */
    featureConfig(
        context: FeatureContext<TProviders, TServices>,
        provider: StringKeys<TProviders>,
        feature: StringKeys<Features<TProviders>>,
    ): unknown | Promise<unknown> {
        return this.config?.feature?.[feature];
    }

    /** Loads a module directly */
    abstract module<T>(): T;

    /** Loads a module asynchronously */
    abstract asyncModule<T>(): Promise<T>;
}
