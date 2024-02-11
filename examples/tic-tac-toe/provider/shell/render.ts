// TODO: This needs to come from a better place....
import { TicTacToeFeatureContext } from '../../index.js';
import { Element } from '../local/layout.js';

export async function createRender(this: TicTacToeFeatureContext) {
    const [ascii, consoleFeature] = await Promise.all([
        this.feature.ascii(),
        this.feature.console(),
    ]);

    let context: ReturnType<typeof consoleFeature.context>;

    return { render };
    
    function render(element: Element) {
        const points = ascii.draw(element);
        if (context) {
            if (context.width !== element.width) {
                throw new Error(`Width has changed. Cannot render`);
            }
            if (context.height !== element.height) {
                throw new Error(`Height has changed. Cannot render`);
            }
        } else {
            context = consoleFeature.context(element.width, element.height);
        }

        for (let index = 0; index < points.length; index++) {
            const point = points[index];
            if (point.skip) {
                continue;
            }

            const x = index % element.width;
            const y = Math.floor(index / element.width);
            
            context.move(x, y);
            context.draw(point.char, point.color, point.background);
        }
    }
}
