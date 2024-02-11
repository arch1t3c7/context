// TODO: This needs to come from a better place
import { TicTacToeFeatureContext } from '../index.js';
import { Entry } from '../provider/local/board.js';

export async function createTicTacToe(context: TicTacToeFeatureContext) {
    await using boardFeaturePromise = context.feature.board();
    await using layoutFeaturePromise = context.feature.layout();
    await using renderFeaturePromise = context.feature.render();

    const [board, layoutFeature, renderFeature] = await Promise.all([
        boardFeaturePromise,
        layoutFeaturePromise,
        renderFeaturePromise,
    ]);

    return {
        start,
        play,
        moveLeft: action(() => board.moveLeft()),
        moveRight: action(() => board.moveRight()),
        moveUp: action(() => board.moveUp()),
        moveDown: action(() => board.moveDown()),
    };

    function start() {
        render();
    }

    function play() {
        const result = board.play(board.selected.x, board.selected.y);
        render();
        return result;
    }

    function action(handler: () => void) {
        return () => {
            handler();
            render();
        };
    }

    function render() {
        const root = createLayout();
        renderFeature.render(root);
    }

    function createLayout() {
        const { TextElement, BorderElement, PaddingElement, GridElement } = layoutFeature;

        const root = new PaddingElement(1, `#ff0000`);

        const border = new BorderElement(`#fff`, `#000`, false);
        root.children.push(border);

        const padding = new PaddingElement(1, `#ff0000`);
        border.children.push(padding);

        const outerGrid = new GridElement(2, 1, 1, `#000`);
        padding.children.push(outerGrid);

        const playerGrid = new GridElement(1, 2, 1, `#000`);
        outerGrid.children.push(playerGrid);

        const player1Padding = new PaddingElement(1, `#ccc`);
        playerGrid.children.push(player1Padding);

        const player1Text = new TextElement(board.names[0], `#0000ff`, `#ccc`);
        player1Padding.children.push(player1Text);

        const player2Padding = new PaddingElement(1, `#ccc`);
        playerGrid.children.push(player2Padding);

        const player2Text = new TextElement(board.names[1], `#00ff00`, `#ccc`);
        player2Padding.children.push(player2Text);

        const boardPadding = new PaddingElement(1, `#000`);
        outerGrid.children.push(boardPadding);

        const boardGrid = new GridElement(3, 3, 1, `#000`);
        boardPadding.children.push(boardGrid);

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const isSelected = board.selected.x === col &&
                    board.selected.y === row;

                const paddingColor = isSelected ?
                    `#ff0000` :
                    `#fff`;

                const blockPadding = new PaddingElement(1, paddingColor);
                boardGrid.children.push(blockPadding);

                const mark = board.marks[row * 3 + col];
                const color = mark === Entry.markedX ?
                    `#0000ff` :
                    `#00ff00`;

                const text = new TextElement(`  ${mark}  `, color, `#ccc`);
                blockPadding.children.push(text);
            }
        }
        
        return root;
    }
}
