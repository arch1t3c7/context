import chalk from 'chalk';
import ansi from 'ansi-escapes';

export async function createConsole() {
    return { context };
    
    function context(width: number, height: number) {
        let currentX = 0;
        let currentY = 0;

        for (let y = 0; y < height; y++) {
            console.log(` `);
        }
        process.stdout.write(ansi.cursorUp(height));

        // TODO: Add clear function

        return {
            width,
            height,
            move,
            draw,
        };

        function move(x: number, y: number) {
            x = Math.min(width - 1, Math.max(0, x));
            y = Math.min(height - 1, Math.max(0, y));

            const offsetX = x - currentX;
            const offsetY = y - currentY;
            currentX = currentX + offsetX;
            currentY = currentY + offsetY;

            process.stdout.write(ansi.cursorMove(offsetX, offsetY));
        }

        function draw(char: string, color: string = `#fff`, background = `#000`) {
            char = char[0] || ' ';
            const fg = chalk.hex(color);
            const bg = chalk.bgHex(background);

            process.stdout.write(fg(bg(char)));
            currentX++;
        }
    }
}
