import { Provider, CachePolicy, GlobalCachePolicy } from '../../../../src/index.js';
import { createAscii } from './ascii.js';
import { createConsole } from './console.js';
import { createRender } from './render.js';

const features = {
    console: createConsole,
    ascii: createAscii,
    render: createRender,
};

export class ShellProvider extends Provider<typeof features> {
    constructor() {
        super(features);
    }

    cachePolicies(): CachePolicy<string, unknown>[] {
        return [new GlobalCachePolicy()];
    }
}
