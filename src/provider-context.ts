import { FeatureContext } from './feature-context';
import { Provider } from './provider';
import { Cache } from './cache/index';
import { EnvironmentContext } from './environment-context';
import type { ProviderFeatures, ProviderType, Providers, Services, StringKeys } from './type';
import { UserError } from './error/user';

export class ProviderContext<TProviders extends Providers, TServices extends Services | void = void> {
    /** The cache to hold the cached providers */
    #cache = new Cache<string, Provider<ProviderFeatures, unknown>>();

    /** The environment the providers are being managed by */
    readonly environmentContext: EnvironmentContext<TProviders, TServices>;

    /* c8 ignore start */

    /** Alias for environmentContext */
    get environment() {
        return this.environmentContext;
    }

    /** Alias for environmentContent.providers */
    get provider() {
        return this.environmentContext.providers;
    }

    /** Alias for environmentContext.services */
    get service() {
        return this.environmentContext.serviceContext?.services || {};
    }

    /* c8 ignore end */

    /** Creates a new provider context which will be used to manage loading and caching of providers */
    constructor(environmentContext: EnvironmentContext<TProviders>) {
        this.environmentContext = environmentContext;
    }

    /**
     * Loads the given provider, using a cached version if one is available.
     * @param providerKey The provider to load
     * @param config THe configuration to initialize the provider with
     * @returns The loaded provider
     */
    async load<TProviderConfig, KProvider extends StringKeys<TProviders>>(providerKey: KProvider, config: TProviderConfig, context: FeatureContext<TProviders, TServices>) {
        // Load the provider module
        const providerFactory = await this.environmentContext.load<ProviderType<TProviders, KProvider>>(providerKey);
        if (providerFactory === undefined) {
            throw new ProviderNotFoundError(`No provider "${String(providerKey)}" could be loaded`, {
                detail: `Unable to load a provider from the environment context with the key "${String(providerKey)}"`,
                providerKey,
            });
        }

        // Instantiate an instance with the config
        const provider = await providerFactory(context, config);
        return provider;
    }

    /** Gain a lock on the provider */
    hold(provider: Provider<ProviderFeatures>) {
        return this.#cache.hold(provider);
    }

    /** Release the lock on the provider */
    release(provider: Provider<ProviderFeatures>) {
        return this.#cache.release(provider);
    }

    /** Disposes the provider context. This will dispose all cached providers. */
    dispose() {
        return this.#cache.dispose();
    }
}

export class ProviderNotFoundError extends UserError {
    constructor(message: string, meta: object) {
        super(message, meta, `PROVIDER_NOT_FOUND`);
    }
}