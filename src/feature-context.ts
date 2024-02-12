import merge from 'lodash.merge';
import { ProviderContext } from './provider-context.js';
import type { FullDisposable, Providers, FeatureShortcuts, StringKeys, Features, FeatureType, ProviderTypeConfig, Services, ServiceShortcuts, ServiceFeatures, ConfigFeatures } from './type.js';
import { UserError } from './error/user.js';
import { Service } from './service.js';

export class FeatureContext<TProviders extends Providers, TServices extends Services | void = void, TEventContext = void> {
    providerContext: ProviderContext<TProviders, TServices, TEventContext>;

    feature: FeatureShortcuts<TProviders>;
    service: ServiceShortcuts<TProviders>;
    configFeature?: StringKeys<ConfigFeatures<TProviders>>;

    /* c8 ignore start */
    get environment() {
        return this.providerContext.environment;
    }

    get providers() {
        return this.providerContext.provider;
    }
    /* c8 ignore end */

    constructor(providerContext: ProviderContext<TProviders, TServices, TEventContext>, configFeature?: FeatureContext<TProviders, TServices, TEventContext>[`configFeature`]) {
        this.providerContext = providerContext;
        this.configFeature = configFeature;

        type LoadHandler = typeof this.load;
        this.feature = buildProxy((...args: Parameters<typeof this.load>) => this.load(...args));
        this.service = buildProxy((...args: Parameters<typeof this.load>) => this.loadService(...args));

        function buildProxy<TShortcuts extends FeatureShortcuts<TProviders>>(handler: LoadHandler) {
            return new Proxy<TShortcuts>({} as TShortcuts, {
                get(_, item: StringKeys<TShortcuts>) {
                    /* c8 ignore start */
                    if (typeof item !== `string`) {
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
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return handler(item as any, config, provider, provider ? providerConfig : undefined);
                    };
                }
            });
        }
    }

    /** A shortcut to load the defined config feature and return it */
    async config(configFeature?: FeatureContext<TProviders, TServices, TEventContext>[`configFeature`]) {
        configFeature = configFeature || this.configFeature;
        if (configFeature === undefined) {
            return undefined;
        }

        const config = await this.load(configFeature, undefined);
        return config;
    }

    protected combineProviderConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    protected combineFeatureConfig<TObject, TSource>(config1: TObject, config2: TSource) {
        return merge({}, config1, config2);
    }

    async loadService<KFeature extends StringKeys<ServiceFeatures<TProviders>>, KProvider extends StringKeys<TProviders>>(
        service: KFeature,
        config: unknown,
        provider?: KProvider,
        providerConfig?: KProvider extends StringKeys<TProviders> ?
            ProviderTypeConfig<TProviders, KProvider> :
            never,            
    ): Promise<FeatureType<TProviders, KFeature> & FullDisposable> {
        const feat = await this.load(service, config, provider, providerConfig);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((feat as any) instanceof Service === false) {
            // Make sure we cleanup
            await feat.dispose();

            // TODO: This may make testing tough
            throw new UserError(`The supplied feature "${service}" exists but is not a service`);
        }

        return feat;
    }

    load = async <KFeature extends StringKeys<Features<TProviders>>, KProvider extends StringKeys<TProviders>>(
        feature: KFeature,
        config: unknown,
        provider?: KProvider,
        suppliedProviderConfig?: KProvider extends StringKeys<TProviders> ?
            ProviderTypeConfig<TProviders, KProvider> :
            never,            
    ): Promise<FeatureType<TProviders, KFeature> & FullDisposable> => {
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
            [Symbol.asyncDispose]: asyncDispose,
        };        
    }
}

export class ProviderNoDefaultError extends UserError {
    constructor(message: string, meta: object) {
        super(message, meta, `PROVIDER_NO_DEFAULT`);
    }
}
