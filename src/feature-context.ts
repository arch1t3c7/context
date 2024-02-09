import merge from 'lodash.merge';
import { ProviderContext } from './provider-context';
import type { Disposable, Providers, FeatureShortcuts, StringKeys, Features, FeatureType, ProviderTypeConfig } from './type';
import { UserError } from './error/user';

export class FeatureContext<TProviders extends Providers> {
    providerContext: ProviderContext<TProviders>;

    feature: FeatureShortcuts<TProviders>;

    /* c8 ignore start */
    get environmentContext() {
        return this.providerContext.environmentContext;
    }

    get providers() {
        return this.providerContext.providers;
    }
    /* c8 ignore end */

    constructor(providerContext: ProviderContext<TProviders>) {
        this.providerContext = providerContext;

        const self = this;
        this.feature = new Proxy<FeatureShortcuts<TProviders>>({} as FeatureShortcuts<TProviders>, {
            get(_, feature: StringKeys<Features<TProviders>>) {
                /* c8 ignore start */
                if (typeof feature !== `string`) {
                    return undefined;
                }
                /* c8 ignore end */
                return function <KProvider extends StringKeys<TProviders> = StringKeys<TProviders>>(
                    config: unknown,
                    provider?: KProvider,
                    providerConfig?: KProvider extends StringKeys<TProviders> ?
                        ProviderTypeConfig<TProviders, KProvider> :
                        never,
                ) {
                    return self.load(feature, config, provider, provider ? providerConfig : undefined);
                };
            }
        });
    }

    protected combineProviderConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    protected combineFeatureConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    async load<KFeature extends StringKeys<Features<TProviders>>, KProvider extends StringKeys<TProviders>>(
        feature: KFeature,
        config: unknown,
        provider?: KProvider,
        suppliedProviderConfig?: KProvider extends StringKeys<TProviders> ?
            ProviderTypeConfig<TProviders, KProvider> :
            never,            
    ): Promise<FeatureType<TProviders, KFeature> & Disposable> {
        if (provider === undefined) {
            // Get the default
            provider = this.environmentContext.defaultProviders[feature] as KProvider;
        }

        if (provider === undefined) {
            throw new ProviderNoDefaultError(`No provider supplied, and no default provider defined for feature "${String(feature)}"`, {
                detail: `Default providers may be added to the environment context on initialization ` +
                    `through the "defaultProviders" parameter of the constructor`,
                feature,
                defaultProviders: this.environmentContext.defaultProviders,
            });
        }

        // Initialize provider
        const loadedProviderConfig = await this.environmentContext.providerConfig(this, provider, feature);
        const providerConfig = this.combineProviderConfig(loadedProviderConfig, suppliedProviderConfig);
        const prov = await this.providerContext.load(provider, providerConfig, this);

        // Initialize feature
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

        // Perform the initial hold
        this.providerContext.hold(prov);

        return {
            ...feat,
            dispose,
            [Symbol.dispose]: syncDispose,
            [Symbol.asyncDispose]: asyncDispose,
        };        
    }
}

export class ProviderNoDefaultError extends UserError {
    constructor(message: string, meta: object) {
        super(message, meta, `PROVIDER_NO_DEFAULT`);
    }
}