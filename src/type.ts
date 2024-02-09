/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Object } from 'ts-toolbelt';
import type { FeatureContext } from './feature-context';
import type { Provider } from './provider';
import { Service } from './service';

/** Gets tuple with all the featurs for a given provider */
type ProviderFeaturesTuple<TProvider extends Provider<any, any>> = TProvider[`features`][string];

/** Gets all features across all providers */
type ProvidersFeaturesTuple<TProviders extends Providers> = ProviderFeaturesTuple<ProviderType<TProviders, StringKeys<TProviders>>>;

type MergeTuple<T extends any[]> = T extends [object, object, ...infer TRest] ?
    Object.Merge<T[0], MergeTuple<[T[1], ...TRest]>> :
    T[0];

/** The structure of the provider factory collection  */
export type Providers = {
    [name: string]: (context: any, config: any) => Promise<Provider<any, any>>
}

/** The features initialization type. This gives way to Features once TProviders is available */
export type ProviderFeatures = {
    [name: string]: (this: FeatureContext<any, any>, feature: string, config: unknown) => Promise<unknown>;
}

/** The structure of the provider factory collection  */
export type Services = {
    [name: string]: Service<any>;
}

/** A utility to extract the config type the provider requires */
export type ProviderTypeConfig<TProviders extends Providers, KProvider extends StringKeys<TProviders>> = Parameters<TProviders[KProvider]>[1];

/** A utility type to extract the return type of the provider factory */
export type ProviderType<TProviders extends Providers, KProvider extends StringKeys<TProviders>> = Awaited<ReturnType<TProviders[KProvider]>>;

/** A utility type to get the named feature factory */
export type FeatureSelector<TProvider extends Provider<any, any>, KFeature extends StringKeys<TProvider[`features`]>> = TProvider[`features`][KFeature];

/** The available feature factories */
export type Features<TProviders extends Providers> = MergeTuple<ProvidersFeaturesTuple<TProviders>>;

/** A utility type to get the config type of a feature */
export type FeatureTypeConfig<TProviders extends Providers, KFeature extends StringKeys<Features<TProviders>>> = Parameters<Features<TProviders>[KFeature]>[1];

/** A utility type to get the return type of the named feature factory */
export type FeatureType<TProviders extends Providers, KFeature extends StringKeys<Features<TProviders>>> = Awaited<ReturnType<Features<TProviders>[KFeature]>>;

/** Builds the feature config */
export type FeatureConfig<TProviders extends Providers> = {
    [KFeature in StringKeys<FeatureType<TProviders, KFeature>>]: FeatureTypeConfig<TProviders, KFeature>;
}

/** THe feature shortcut functions */
export type FeatureShortcuts<TProviders extends Providers> = {
    [KFeature in StringKeys<Features<TProviders>>]: <TProvider extends StringKeys<TProviders>>(config: FeatureTypeConfig<TProviders, KFeature>, provider?: TProvider, providerConfig?: ProviderTypeConfig<TProviders, TProvider>) => Promise<FeatureType<TProviders, KFeature>>
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

export type ProviderLoader<TProvider> = (context: FeatureContext<any, any>, config: any) => Promise<TProvider>;

export type ServiceEventHandler<TEventContext, TEvents = never> = (this: Service<TEventContext, TEvents>, requestContext?: TEventContext) => void;

export type AnyFunc = (...args: any[]) => any;

export type Disposable = {
    dispose: () => void | Promise<void>;
    [Symbol.asyncDispose]: () => void | Promise<void>;
    [Symbol.dispose]: () => void;
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type StringKeys<T> = Extract<keyof T, string>;
