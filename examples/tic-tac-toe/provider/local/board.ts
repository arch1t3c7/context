export enum Entry {
    unmarked = ` `,
    markedX = `x`,
    markedO = `o`
}

export interface BoardConfig {
    names?: [string, string];
}

export async function createBoard(config?: BoardConfig) {
    const names = config?.names || [`Player 1`, `Player 2`];
    return {
        player: 0,
        names,

        get name() {
            return names[this.player];
        },

        selected: {
            x: 0,
            y: 0,
        },

        marks: Array<Entry>(9).fill(Entry.unmarked),

        play(x: number, y: number) {
            if (x < 0 || x > 2 || y < 0 || y > 2) {
                throw new Error(`Invalid x "${x}" or y "${y}" supplied`);
            }

            const markIndex = y * 3 + x;
            if (this.marks[markIndex] !== Entry.unmarked) {
                return false;
            }

            if (this.player === 0) {
                this.marks[markIndex] = Entry.markedX;
            } else {
                this.marks[markIndex] = Entry.markedO;
            }

            this.player = (this.player + 1) % 2;
            return true;
        },

        moveLeft() {
            this.selected.x = (this.selected.x + 2) % 3;
        },

        moveRight() {
            this.selected.x = (this.selected.x + 1) % 3;
        },

        moveUp() {
            this.selected.y = (this.selected.y + 2) % 3;
        },

        moveDown() {
            this.selected.y = (this.selected.y + 1) % 3;
        },
    };
}