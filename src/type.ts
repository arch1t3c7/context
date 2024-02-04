/* eslint-disable @typescript-eslint/no-explicit-any */
import type { FeatureContext } from './feature-context';
import type { Provider } from './provider';

// TODO: Make feature map have type and config named
export type FeatureMap = {
    [name: string]: [any, any];
}

// TODO: Make provider map jave type and config named
export type ProviderMap<TFeatureMap extends FeatureMap> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [name: string]: [() => Provider<TFeatureMap>, any];
}

export type ProviderConfig<TProviderMap extends ProviderMap<TFeatureMap>, TFeatureMap extends FeatureMap> = {
    feature: {
        [K in keyof TFeatureMap]: TFeatureMap[K][1]
    },
    provider: {
        [K in keyof TProviderMap]: TProviderMap[K][1]
    },
}

export type ProviderLoader<
    TProviderMap extends ProviderMap<TFeatureMap>,
    TFeatureMap extends FeatureMap,
    TProviderConfig,
    TEnvironmentConfig extends ProviderConfig<TProviderMap, TFeatureMap> | void,
> = (context: FeatureContext<TProviderMap, TFeatureMap, TEnvironmentConfig>, config: TProviderConfig) => Provider<TFeatureMap, TProviderConfig>;

export type FeatureShortcuts<TProviderMap extends ProviderMap<TFeatureMap>, TFeatureMap extends FeatureMap, TProvider extends keyof TProviderMap> = {
    [k in keyof TFeatureMap]: (config?: TFeatureMap[k][1], provider?: TProvider, providerConfig?: DeepPartial<TProviderMap[TProvider][1]>) => Promise<TFeatureMap[k][0]>;
}

export type AnyFunc = (...args: any[]) => any;

export type Disposable = {
    dispose: () => void | Promise<void>;
    [Symbol.asyncDispose]: () => void | Promise<void>;
    [Symbol.dispose]: () => void;
}

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;
