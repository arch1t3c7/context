import readline from 'node:readline';
import { Service, ServiceEvent } from '../../../src/service.js';
import { EventContext, TicTacToeEvent } from './event-context.js';

readline.emitKeypressEvents(process.stdin);

type KeyPressKey = {
    sequence: string,
    name: string,
    ctrl: boolean,
    meta: boolean,
    shift: boolean,
}

export class CliService extends Service<EventContext> {
    #reader: readline.Interface | undefined;

    async start(): Promise<void> {
        this.#reader = readline.createInterface({
            input: process.stdin
        });
       
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on(`keypress`, this.#onKeypress);
        await super.start();
    }

    async stop() {
        process.stdin.removeListener(`keypress`, this.#onKeypress);

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
        }

        if (this.#reader) {
            this.#reader.close();
            this.#reader = undefined;
        }

        await super.stop();
    }

    #onKeypress = (chunk: unknown, key: KeyPressKey) => {
        // console.log(`onKeyPress`, key);
        if (key.name === `c` && key.ctrl === true) {
            process.emit(`SIGTERM`, `SIGTERM`);
            return;
        }

        switch (key.name) {
            case `up`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.moveUp });
                break;
            case `down`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.moveDown });
                break;
            case `left`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.moveLeft });
                break;
            case `right`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.moveRight });
                break;
            case `space`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.play });
                break;
            case `return`:
                this.emit(ServiceEvent.event, { event: TicTacToeEvent.start });
                break;
            default:
                break;
        }
    }
}
