export enum TicTacToeEvent {
    start,
    play,
    moveLeft,
    moveRight,
    moveUp,
    moveDown,
}

export interface EventContext {
    event: TicTacToeEvent;
}