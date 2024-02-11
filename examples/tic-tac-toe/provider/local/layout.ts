export async function createLayout() {
    return {
        ElementType,
        Element,
        PaddingElement,
        TextElement,
        BorderElement,
        GridElement,
    };
}

export enum ElementType {
    padding = `padding`,
    text = `text`,
    border = `border`,
    grid = `grid`,
}

export abstract class Element {
    type: ElementType;
    children: Element[] = [];

    get width() {
        return this.innerWidth;
    }

    get innerWidth(): number {
        if (this.children.length === 0) {
            return 1;
        }

        return this.children.reduce(
            (result, child) => result + child.width,
            0,
        );
    }

    get height() {
        return this.innerHeight;
    }

    get innerHeight(): number {
        if (this.children.length === 0) {
            return 1;
        }

        return this.children.reduce(
            (result, child) => Math.max(result, child.height),
            1,
        );
    }

    constructor(type: ElementType) {
        this.type = type;
    }
}

export class PaddingElement extends Element {
    padding: number;
    background: string;

    get width() {
        return this.innerWidth + this.padding * 2;
    }

    get height() {
        return this.innerHeight + this.padding * 2;
    }

    constructor(padding = 1, background = `#000`) {
        super(ElementType.padding);
        this.padding = padding;
        this.background = background;
    }
}

export class BorderElement extends Element {
    color: string;
    background: string;
    plain: boolean;

    get width() {
        return this.innerWidth + 2;
    }

    get height() {
        return this.innerHeight + 2;
    }

    constructor(color = `#fff`, background = `#000`, plain = false) {
        super(ElementType.border);
        this.plain = plain;
        this.color = color;
        this.background = background;
    }
}

export class GridElement extends Element {
    rowCount: number;
    columnCount: number;
    gap: number;
    gapColor: string;

    get width(): number {
        return this.innerWidth;
    }

    get height(): number {
        return this.innerHeight;
    }

    get innerWidth(): number {
        return this.rows.reduce(
            (result, _, index) => Math.max(result, this.rowWidth(index)),
            0,
        );
    }

    get innerHeight(): number {
        const gap = this.gap * (this.rowCount - 1);
        return this.rows.reduce(
            (result, _, index) => result + this.rowHeight(index),
            0,
        ) + gap;
    }

    get rows() {
        if ((this.children.length !== (this.columnCount * this.rowCount))) {
            throw new Error(`Invalid children length. Must be exactly ${this.columnCount * this.rowCount}`);
        }

        const result: Element[][] = [];
        for (let row = 0; row < this.rowCount; row++) {
            const columns: Element[] = [];
            result.push(columns);
            for (let col = 0; col < this.columnCount; col++) {
                columns.push(this.children[row * this.columnCount + col]);
            }
        }

        return result;
    }

    constructor(rows: number, cols: number, gap = 1, gapColor = `#000`) {
        super(ElementType.grid);

        this.rowCount = rows;
        this.columnCount = cols;
        this.gap = gap;
        this.gapColor = gapColor;
    }

    child(row: number, col: number) {
        if (row < 0 || row >= this.rowCount) {
            throw new Error(`row is out of bounds`);
        }
        if (col < 0 || col >= this.columnCount) {
            throw new Error(`col is out of bounds`);
        }
        return this.children[row * this.columnCount + col];
    }

    rowY(row: number) {
        if (row < 0 || row >= this.rowCount) {
            throw new Error(`row is out of bounds`);
        }
        if (row === 0) {
            return 0;
        }
        return this.rows.slice(0, row).reduce(
            (result, _, index) => result + this.rowHeight(index) + this.gap,
            0
        );
    }

    colX(row: number, col: number) {
        if (row < 0 || row >= this.rowCount) {
            throw new Error(`row is out of bounds`);
        }
        if (col < 0 || col >= this.columnCount) {
            throw new Error(`col is out of bounds`);
        }
        if (col === 0) {
            return 0;
        }

        const columns = this.rows[row];
        return columns.slice(0, col).reduce(
            (result, element) => result + element.width + this.gap,
            0
        );
    }

    rowWidth(row: number) {
        if (row < 0 || row >= this.rowCount) {
            throw new Error(`row is out of bounds`);
        }

        const columns = this.rows[row];
        const gap = this.gap * (columns.length - 1);

        return columns.reduce(
            (result, element) => result + element.width,
            0,
        ) + gap;
    }

    rowHeight(row: number) {
        if (row < 0 || row >= this.rowCount) {
            throw new Error(`row is out of bounds`);
        }

        // No gap on individual row height

        return this.rows[row].reduce(
            (result, element) => Math.max(result, element.height),
            0,
        );
    }
}

export class TextElement extends Element {
    text: string;
    background: string;
    color: string;

    get width(): number {
        return this.innerWidth;
    }

    get height(): number {
        return this.innerHeight;
    }

    get innerWidth(): number {
        return this.text.length;
    }

    get innerHeight(): number {
        return 1;
    }

    constructor(text: string, foreground = `#fff`, background = `#000`) {
        super(ElementType.text);
        this.text = text;
        this.background = background;
        this.color = foreground;
    }
}
