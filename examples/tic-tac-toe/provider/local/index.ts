import { Provider, CachePolicy, GlobalCachePolicy } from '../../../../src/index.js';
import { createBoard } from './board.js';
import { createLayout } from './layout.js';

const features = {
    board: createBoard,
    layout: createLayout,
};

export class LocalProvider extends Provider<typeof features> {
    constructor() {
        super(features);
    }

    cachePolicies(): CachePolicy<string, unknown>[] {
        return [new GlobalCachePolicy()];
    }
}
