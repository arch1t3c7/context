import merge from 'lodash.merge';
import { ProviderContext } from './provider-context.js';
import type { FullDisposable, Providers, FeatureShortcuts, StringKeys, Features, FeatureType, ProviderTypeConfig, Services } from './type.js';
import { UserError } from './error/user.js';

const ASYNC_DISPOSE = Symbol(`async-dispose`);

export class FeatureContext<TProviders extends Providers, TServices extends Services | void = void, TEventContext = void> {
    providerContext: ProviderContext<TProviders, TServices, TEventContext>;

    feature: FeatureShortcuts<TProviders>;

    /* c8 ignore start */
    get environment() {
        return this.providerContext.environment;
    }

    get providers() {
        return this.providerContext.provider;
    }

    get services() {
        return this.providerContext.service;
    }
    /* c8 ignore end */

    constructor(providerContext: ProviderContext<TProviders, TServices, TEventContext>) {
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

    load<KFeature extends StringKeys<Features<TProviders>>, KProvider extends StringKeys<TProviders>>(
        feature: KFeature,
        config: unknown,
        provider?: KProvider,
        suppliedProviderConfig?: KProvider extends StringKeys<TProviders> ?
            ProviderTypeConfig<TProviders, KProvider> :
            never,            
    ): Promise<FeatureType<TProviders, KFeature>> & AsyncDisposable {
        const prom = this.#load(feature, config, provider, suppliedProviderConfig);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const disposableProm: (typeof prom & AsyncDisposable) = prom as any;
        let loadedFeature: Awaited<typeof prom> | undefined;
        prom.then(
            (feat) => { loadedFeature = feat },
            // This style can lead to false inhandled rejections, so we make sure we don't get any
            () => undefined,
        );

        disposableProm[Symbol.asyncDispose] = async () => {
            if (loadedFeature === undefined) {
                return;
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (loadedFeature as any)[ASYNC_DISPOSE]();
        };

        return disposableProm;
    }

    async #load<KFeature extends StringKeys<Features<TProviders>>, KProvider extends StringKeys<TProviders>>(
        feature: KFeature,
        config: unknown,
        provider?: KProvider,
        suppliedProviderConfig?: KProvider extends StringKeys<TProviders> ?
            ProviderTypeConfig<TProviders, KProvider> :
            never,            
    ): Promise<FeatureType<TProviders, KFeature> & FullDisposable> {
        if (provider === undefined) {
            // Get the default
            provider = this.environment.defaultProviders[feature] as KProvider;
        }

        if (provider === undefined) {
            throw new ProviderNoDefaultError(`No provider supplied, and no default provider defined for feature "${String(feature)}"`, {
                detail: `Default providers may be added to the environment context on initialization ` +
                    `through the "defaultProviders" parameter of the constructor`,
                feature,
                defaultProviders: this.environment.defaultProviders,
            });
        }

        // Initialize provider
        const loadedProviderConfig = await this.environment.providerConfig(this, provider, feature);
        const providerConfig = this.combineProviderConfig(loadedProviderConfig, suppliedProviderConfig);
        const prov = await this.providerContext.load(provider, providerConfig, this);

        // Initialize feature
        const featureConfig = await this.environment.featureConfig(this, provider, feature);
        const combined = this.combineFeatureConfig(featureConfig, config);
        const feat = await prov.loadFeature(this, feature, combined);

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
            [ASYNC_DISPOSE]: asyncDispose,
        };        
    }
}

export class ProviderNoDefaultError extends UserError {
    constructor(message: string, meta: object) {
        super(message, meta, `PROVIDER_NO_DEFAULT`);
    }
}