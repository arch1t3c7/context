import hash from 'object-hash';
import { ProviderFeatures } from './type.js';
import { Cachable } from './cache/cache-item.js';
import { CachePolicy } from './cache/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Provider<TFeatures extends ProviderFeatures = any, TConfig = void> implements Cachable<string> {
    readonly name: string;
    readonly config: TConfig;
    readonly feature: TFeatures;
    readonly cacheKey: string;

    constructor(feature: TFeatures, config: TConfig, name?: string) {
        this.name = name || this.constructor.name;
        this.config = config;
        this.cacheKey = this.generateCacheKey();
        this.feature = feature;
    }

    /**
     * Loads a given feature from the provider.
     * @param context The feature context loading the feature
     * @param feature The feature to load
     * @param config The feature config to supply to the feature factory
     * @returns The loaded feature
     */
    async loadFeature<TFeature extends keyof TFeatures>(
        context: ThisParameterType<TFeatures[TFeature]>,
        feature: TFeature,
        config: Parameters<TFeatures[TFeature]>[1]
    ): Promise<Awaited<ReturnType<TFeatures[TFeature]>>> {
        const factory = this.feature[feature];

        if (!factory) {
            throw new Error(`Provider ${this.name} does not support feature "${String(feature)}"`);
        }

        const created = await factory.call(context, config);
        return created;
    }

    /** Returns the policies for the provider. These should be static as they will be retrieved once per unique provider name */
    abstract cachePolicies(): CachePolicy<string, unknown>[];

    /**
     * Generates a unique hash for the provider instance based on the
     *  config supplied
     * @returns A unique identifier generated from the config
     */
    generateCacheKey() {
        return hash({ config: this.config });
    }

    /* c8 ignore start */
    /** Initializes the provider */
    initialize(): void | Promise<void> {
        // Does nothing. Meant to be overridden if required
    }

    /** Disposes the provider */
    dispose(): void | Promise<void> {
        // Placeholder
    }
    /* c8 ignore end */
}
