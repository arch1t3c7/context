import { FeatureContext } from './index';
import type { FeatureMap, ProviderConfig, ProviderMap, ProviderLoader } from './type';

export abstract class EnvironmentContext<
    TProviderMap extends ProviderMap<TFeatureMap>,
    TFeatureMap extends FeatureMap,
    TEnvironmentConfig extends ProviderConfig<TProviderMap, TFeatureMap> | void,
> {
    /** The base config for the environment */
    config: TEnvironmentConfig;

    /** The default providers for features */
    provider = { } as Record<keyof TFeatureMap, keyof TProviderMap>;

    constructor(config: TEnvironmentConfig, provider?: Record<keyof FeatureMap, keyof TProviderMap>) {
        this.config = config;
        Object.assign(this.provider, provider);
    }

    /** The provider module loader */
    abstract load<TProviderConfig>(provider: keyof TProviderMap): Promise<ProviderLoader<TProviderMap, TFeatureMap, TProviderConfig, TEnvironmentConfig>>;

    /** Returns the base configuration for the provider */
    providerConfig(context: FeatureContext<TProviderMap, TFeatureMap, TEnvironmentConfig>, provider: keyof TProviderMap, feature: keyof TFeatureMap): unknown | Promise<unknown> {
        // Return the default provider config for the environment
        return this.config?.provider?.[provider];
    }

    /** Returns the base configuration for the feature */
    featureConfig(context: FeatureContext<TProviderMap, TFeatureMap, TEnvironmentConfig>, provider: keyof TProviderMap, feature: keyof TFeatureMap): unknown | Promise<unknown> {
        // Return the default feature config for the environment
        return this.config?.feature?.[feature];
    }

    /** Loads a module directly */
    abstract module<T>(): T;

    /** Loads a module asynchronously */
    abstract asyncModule<T>(): Promise<T>;
}
