import hash from 'object-hash';
import { ProviderFeatures } from './type';
import { Cachable } from './cache/cache-item';
import { CachePolicy } from './cache/index';

export abstract class Provider<TFeatures extends ProviderFeatures, TConfig = void> implements Cachable<string> {
    readonly name: string;
    readonly config: TConfig;
    readonly features: TFeatures;
    readonly cacheKey: string;

    constructor(features: TFeatures, config: TConfig) {
        this.name = this.constructor.name;
        this.config = config;
        this.cacheKey = this.generateCacheKey();
        this.features = features;
    }

    /**
     * Loads a given feature from the provider.
     * @param context The feature context loading the feature
     * @param feature The feature to load
     * @param config The feature config to supply to the feature factory
     * @returns The loaded feature
     */
    // abstract feature<TFeatureContext, TFeature extends keyof TFeatureMap>(context: TFeatureContext, feature: TFeature, config: TFeatureMap[TFeature][1]): Promise<TFeatureMap[TFeature][0]>;
    abstract feature<
        TFeature extends keyof TFeatures
    >(
        context: Parameters<TFeatures[TFeature]>[1],
        feature: TFeature,
        config: Parameters<TFeatures[TFeature]>[2]
    ): Promise<ReturnType<TFeatures[TFeature]>>;

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
