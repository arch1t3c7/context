import { FeatureContext } from './feature-context';
import { Provider } from './provider';
import { FeatureMap, ProviderMap } from './type';
import { Cache } from './cache/index';
import { EnvironmentContext } from './environment-context';
import type { ProviderConfig } from './type';

export class ProviderContext<
    TProviderMap extends ProviderMap<TFeatureMap>,
    TFeatureMap extends FeatureMap,
    TEnvironmentConfig extends ProviderConfig<TProviderMap, TFeatureMap> | void
> {
    #cache = new Cache<string, Provider<TFeatureMap>>();
    readonly environmentContext: EnvironmentContext<
        TProviderMap,
        TFeatureMap,
        TEnvironmentConfig
    >;

    constructor(environmentContext: EnvironmentContext<TProviderMap, TFeatureMap, TEnvironmentConfig>) {
        this.environmentContext = environmentContext;
    }

    /**
     * Loads the given provider, using a cached version if one is available.
     * @param providerKey The provider to load
     * @param config THe configuration to initialize the provider with
     * @returns The loaded provider
     */
    async load<TProviderConfig>(providerKey: keyof TProviderMap, config: TProviderConfig, context: FeatureContext<TProviderMap, TFeatureMap, TEnvironmentConfig>) {
        // Load the provider module
        const providerFactory = await this.environmentContext.load<TProviderConfig>(providerKey);
        if (providerFactory === undefined) {
            throw new Error(`No provider "${String(providerKey)}" could be loaded`);
        }

        // Instantiate an instance with the config
        const provider = providerFactory(context, config);
        return provider;
    }

    /** Gain a lock on the provider */
    hold(provider: Provider<TFeatureMap>) {
        return this.#cache.hold(provider);
    }

    /** Release the lock on the provider */
    release(provider: Provider<TFeatureMap>) {
        return this.#cache.release(provider);
    }

    /**
     * Disposes the provider context. This will dispose all cached providers.
     */
    dispose() {
        return this.#cache.dispose();
    }
}
