import merge from 'lodash.merge';
import { ProviderContext } from './provider-context';
import type { FeatureMap, ProviderConfig, ProviderMap, Disposable, AnyFunc, FeatureShortcuts } from './type';

export class FeatureContext<
    TProviderMap extends ProviderMap<TFeatureMap>,
    TFeatureMap extends FeatureMap,
    TEnvironmentConfig extends ProviderConfig<TProviderMap, TFeatureMap> | void
> {
    providerContext: ProviderContext<TProviderMap, TFeatureMap, TEnvironmentConfig>;

    get environmentContext() {
        return this.providerContext.environmentContext;
    }

    constructor(providerContext: ProviderContext<TProviderMap, TFeatureMap, TEnvironmentConfig>) {
        this.providerContext = providerContext;

        for (const key of Object.keys(this.environmentContext.provider)) {
            (this.feature[key] as AnyFunc) = (config: unknown, provider: keyof TProviderMap, providerConfig: unknown) => {
                return this.load(key, config, provider, providerConfig);
            };
        }
    }

    feature = {} as FeatureShortcuts<TProviderMap, TFeatureMap, keyof TProviderMap>;

    protected combineProviderConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    protected combineFeatureConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    async load<T extends keyof TFeatureMap>(feature: T, config: unknown, provider?: keyof TProviderMap, suppliedProviderConfig?: unknown): Promise<TFeatureMap[T] & Disposable> {
        // TODO: Add type limit to say provider config may only be supplied when provider is supplied

        if (provider === undefined) {
            // Get the default
            provider = this.environmentContext.provider[feature];
        }

        if (provider === undefined) {
            throw new Error(`No provider supplied, and no default provider defined for feature "${String(feature)}"`);
        }

        // Get the loaded config
        const loadedProviderConfig = await this.environmentContext.providerConfig(this, provider, feature);
        const providerConfig = this.combineProviderConfig(loadedProviderConfig, suppliedProviderConfig);
        const prov = await this.providerContext.load(provider, providerConfig, this);

        const featureConfig = await this.environmentContext.featureConfig(this, provider, feature);
        const combined = this.combineFeatureConfig(featureConfig, config);

        const feat = await prov.feature(this, feature, combined);

        const dispose = () => {
            this.providerContext.release(prov);
            if (typeof feat.dispose === `function`) {
                return feat.dispose();
            }
        };

        const syncDispose = () => {
            this.providerContext.release(prov);
            if (typeof feat[Symbol.dispose] === `function`) {
                feat[Symbol.dispose]();
            }
        };

        const asyncDispose = async () => {
            this.providerContext.release(prov);
            if (typeof feat[Symbol.asyncDispose] === `function`) {
                await feat[Symbol.asyncDispose]();
            }
        };

        this.providerContext.hold(prov);

        return {
            ...feat,
            dispose,
            [Symbol.dispose]: syncDispose,
            [Symbol.asyncDispose]: asyncDispose,
        };        
    }
}

export type FeatureFactory<TFeatureMap extends FeatureMap, TFeatureContext> = {
    [k in keyof TFeatureMap]?: (context: TFeatureContext, config: TFeatureMap[k][1], providerConfig?: unknown) => Promise<TFeatureMap[k][0]>;
}
