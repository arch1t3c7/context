/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Union } from 'ts-toolbelt';
import type { FeatureContext } from './feature-context.js';
import type { Provider } from './provider.js';
import type { Service } from './service.js';
import { EnvironmentContext } from './environment-context.js';

type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends
    ((k: infer I) => void) ? I : never

type LastOf<T> = UnionToIntersection<
    T extends any ? () => T : never> extends
    () => (infer R) ? R : never

type Dedupe<T, L = LastOf<T>, N = [T] extends [never] ? true : false> =
    true extends N ? never : Dedupe<Exclude<T, L>> | L;

/** The structure of the provider factory collection  */
export type Providers = {
    [name: string]: (context: any, config: any) => Promise<Provider<any, any>>
}

/** The features initialization type. This gives way to Features once TProviders is available */
export type ProviderFeatures = {
    [name: string]: (this: FeatureContext<any, any, any>, config: any) => Promise<any>;
}

/** The structure of the provider factory collection  */
export type Services = {
    [name: string]: Service<any, any, any>;
}

/** A utility to extract the config type the provider requires */
export type ProviderTypeConfig<TProviders extends Providers, KProvider extends StringKeys<TProviders>> = Parameters<TProviders[KProvider]>[1];

/** A utility type to extract the return type of the provider factory */
export type ProviderType<TProviders extends Providers, KProvider extends StringKeys<TProviders>> = Awaited<ReturnType<TProviders[KProvider]>>;

/** A utility type to get the named feature factory */
export type FeatureSelector<TProvider extends Provider<any, any>, KFeature extends StringKeys<TProvider[`feature`]>> = TProvider[`feature`][KFeature];

/** The available feature factories */
type UnifiedFeatures<TProviders extends Providers> = Union.Merge<ProviderType<TProviders, StringKeys<TProviders>>[`feature`]>;

type DedupedFeatures<TProviders extends Providers> = {
    [KFeature in StringKeys<UnifiedFeatures<TProviders>>]: Dedupe<UnifiedFeatures<TProviders>[KFeature]>
};

export type Features<TProviders extends Providers> = {
    [KFeature in StringKeys<DedupedFeatures<TProviders>>]: DedupedFeatures<TProviders>[KFeature] extends AnyFunc ?
        DedupedFeatures<TProviders>[KFeature] :
        never
}

export type ServiceFeatures<TProviders extends Providers> = {
    [KFeature in StringKeys<Features<TProviders>>]: FeatureType<TProviders, KFeature> extends Service<any, any, any> ?
        Features<TProviders>[KFeature] :
        never
}

export type ConfigFeatures<TProviders extends Providers> = {
    [KFeature in StringKeys<Features<TProviders>>]: FeatureType<TProviders, KFeature> extends ProviderConfig<TProviders> ?
        Features<TProviders>[KFeature] :
        never
}

/** A utility type to get the config type of a feature */
export type FeatureTypeConfig<TProviders extends Providers, KFeature extends StringKeys<Features<TProviders>>> = Parameters<Features<TProviders>[KFeature]>[0];

/** A utility type to get the return type of the named feature factory */
export type FeatureType<TProviders extends Providers, KFeature extends StringKeys<Features<TProviders>>> = Awaited<ReturnType<Features<TProviders>[KFeature]>>;

/** Builds the feature config */
export type FeatureConfig<TProviders extends Providers> = {
    [KFeature in StringKeys<Features<TProviders>>]: FeatureTypeConfig<TProviders, KFeature>;
}

/** The feature shortcut functions */
export type FeatureShortcuts<TProviders extends Providers> = {
    [KFeature in StringKeys<Features<TProviders>>]: <TProvider extends StringKeys<TProviders>>(
        config?: FeatureTypeConfig<TProviders, KFeature>,
        provider?: TProvider,
        providerConfig?: ProviderTypeConfig<TProviders, TProvider>
    ) => Promise<FullDisposable & FeatureType<TProviders, KFeature>> & AsyncDisposable
}

/** The service shortcut functions */
export type ServiceShortcuts<TProviders extends Providers> = {
    [KFeature in StringKeys<ServiceFeatures<TProviders>>]: <TProvider extends StringKeys<TProviders>>(
        config?: FeatureTypeConfig<TProviders, KFeature>,
        provider?: TProvider,
        providerConfig?: ProviderTypeConfig<TProviders, TProvider>
    ) => Promise<FullDisposable & FeatureType<TProviders, KFeature>> & AsyncDisposable
}

/** The providers config structure derived from the providers factory collection */
export type ProviderConfig<TProviders extends Providers> = {
    feature?: FeatureConfig<TProviders>;
    provider?: {
        [K in StringKeys<TProviders>]: Parameters<TProviders[K]>[1]
    };
}

/** Provides a way to tie together providers and the default config */
export type DefaultProviders<TProviders extends Providers> = Partial<Record<StringKeys<Features<TProviders>>, StringKeys<TProviders>>>;

export type ServiceEventHandler<TEventContext, TEvents = never> = (this: Service<TEventContext, TEvents, any>, context?: TEventContext) => void;
export type EnvironmentContextEventHandler<TProviders extends Providers, TServices extends Services | void, TEventContext> = TServices extends Services ?
    (this: EnvironmentContext<TProviders, TServices, TEventContext>, service: StringKeys<TServices>, context?: TEventContext) => void :
    never;

export type AnyFunc = (...args: any[]) => any;

export type FullDisposable = Disposable & AsyncDisposable & {
    dispose: () => void | Promise<void>;
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type StringKeys<T> = Extract<keyof T, string>;
