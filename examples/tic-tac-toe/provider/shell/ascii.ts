// TODO: This needs to come from a better place
import { TicTacToeFeatureContext } from '../../index.js';
import type { Element, TextElement, BorderElement, PaddingElement, GridElement } from '../local/layout.js';

export type RenderPoint = {
    char: string;
    skip: boolean;
    color: string;
    background: string;
}

export async function createAscii(this: TicTacToeFeatureContext) {
    const { ElementType } = await this.feature.layout();
    return { draw };

    function draw(element: Element): RenderPoint[] {
        // console.log(`draw`, element.type);
        switch (element.type) {
            case ElementType.border:
                return drawBorder(element as BorderElement);
            case ElementType.text:
                return drawText(element as TextElement);
            case ElementType.grid:
                return drawGrid(element as GridElement);
            case ElementType.padding:
                return drawPadding(element as PaddingElement);
            default:
                throw new Error(`Unrecognized element type ${element.type}`);
        }
    }
    
    function drawText(element: TextElement) {
        const result = Array<RenderPoint>(element.text.length);
        for (let index = 0; index < element.text.length; index++) {
            const char = element.text[index];
            result[index] = {
                char,
                skip: false,
                color: element.color,
                background: element.background,
            };
        }
        return result;
    }
    
    function drawPadding(element: PaddingElement) {
        if (element.children.length !== 1) {
            throw new Error(`Padding MUST have exactly one child`);
        }
        const child = element.children[0];

        const width = element.width;
        const height = element.height;
        const bg = element.background;       
    
        const result = Array(width * height);
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                const edge = col === 0 ||
                    row === 0 ||
                    col === width - 1 ||
                    row === height - 1;
    
                result[row * width + col] = {
                    char: ` `,
                    skip: !edge,
                    color: `#fff`,
                    background: bg,
                };
            }            
        }
    
        const content = draw(child);
        inDraw(result, element.width, 1, 1, content, child.width, child.height);
        return result;
    }
    
    function drawBorder(element: BorderElement) {
        const width = element.width;
        const height = element.height;

        if (element.children.length !== 1) {
            throw new Error(`Border element requires exactly one child`);
        }
        const child = element.children[0];
    
        const result = Array(width * height);
    
        const entry = (row: number, col: number, char?: string) => {
            let finalChar = char === undefined ? ` ` : char;
            if (finalChar !== undefined && element.plain) {
                finalChar = ` `;
            }
    
            result[row * width + col] = {
                char: finalChar,
                skip: char === undefined,
                color: element.color,
                background: element.background,
            };
        }
    
        for (let col = 0; col < width; col++) {
            for (let row = 0; row < height; row++) {
                const isFirstRow = row === 0;
                const isLastRow = row === height - 1;
    
                const isFirstCol = col === 0;
                const isLastCol = col === width - 1;
    
                if (isFirstCol && isFirstRow) {
                    entry(row, col, `╒`);
                } else if (isFirstCol && isLastRow) {
                    entry(row, col, `╘`);
                } else if (isLastCol && isFirstRow) {
                    entry(row, col, `╕`);
                } else if (isLastCol && isLastRow) {
                    entry(row, col, `╛`);
                } else if (isFirstRow || isLastRow) {
                    entry(row, col, `═`);
                } else if (isFirstCol || isLastCol) {
                    entry(row, col, `│`);
                } else {
                    entry(row, col);
                }                
            }
        }
    
        const content = draw(child);
        inDraw(result, width, 1, 1, content, child.width, child.height);
        return result;
    }
    
    function drawGrid(element: GridElement) {
        const width = element.width;
        const result = Array(width * element.height);

        // TODO: Children might not take up the whole width....
    
        for (let row = 0; row < element.rowCount; row++) {
            const y = element.rowY(row);
            const height = element.rowHeight(row);
    
            for (let col = 0; col < element.columnCount; col++) {
                const x = element.colX(row, col);
                const child = element.child(row, col);
                const content = draw(child);
                inDraw(result, width, x, y, content, child.width, child.height);
    
                // Draw the column gap on all except the last
                if (col < element.columnCount - 1 && element.gap > 0) {
                    const gap = Array(height * element.gap).fill({
                        char: ` `,
                        skip: false,
                        color: `#fff`,
                        background: element.gapColor,
                    });
    
                    inDraw(result, width, x + child.width, y, gap, element.gap, child.height);
                }
            }
    
            // Draw the row gap on all except the last
            if (row < element.rowCount - 1 && element.gap > 0) {
                const gap = Array(width * element.gap).fill({
                    char: ` `,
                    skip: false,
                    color: `#fff`,
                    background: element.gapColor,
                });
    
                inDraw(result, width, 0, y + height, gap, width, element.gap);
            }
        }
    
        return result;
    }
    
    function inDraw(
        outer: RenderPoint[],
        outerWidth: number,
        x: number,
        y: number,
        inner: RenderPoint[],
        width: number,
        height: number,
        empty = `#000`
    ) {
        const offset = y * outerWidth + x;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const blockIndex = offset + row * outerWidth + col;
                if (inner[row * width + col] === undefined) {
                    outer[blockIndex] = {
                        background: empty,
                        char: ` `,
                        color: `#fff`,
                        skip: false,
                    }
                } else {
                    outer[blockIndex] = inner[row * width + col];
                }
            }
        }
    }
    
}
