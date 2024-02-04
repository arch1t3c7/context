import hash from 'object-hash';
import { FeatureMap } from './type';
import { Cachable } from './cache/cache-item';
import { CachePolicy } from './cache/index';

export abstract class Provider<TFeatureMap extends FeatureMap, TFeatureContext = unknown, TConfig = unknown> implements Cachable<string> {
    readonly name: string;
    readonly config: TConfig;
    readonly cacheKey: string;

    constructor(name: string, config: TConfig) {
        this.name = name;
        this.config = config;
        this.cacheKey = this.generateCacheKey();
    }

    /**
     * Loads a given feature from the provider.
     * @param context The feature context loading the feature
     * @param feature The feature to load
     * @param config The feature config to supply to the feature factory
     * @returns The loaded feature
     */
    abstract feature<TFeature extends keyof TFeatureMap>(context: TFeatureContext, feature: TFeature, config: TFeatureMap[TFeature][1]): Promise<TFeatureMap[TFeature][0]>;

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
