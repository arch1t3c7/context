export class Deferred<TResult = void, TError = Error> {
    promise: Promise<TResult>;
    #resolve?: (result: TResult) => void;
    #reject?: (error: TError) => void;

    get resolve() {
        return this.#resolve!;
    }

    get reject() {
        return this.#reject!;
    }

    constructor() {
        this.promise = new Promise<TResult>((res, rej) => {
            this.#resolve = res;
            this.#reject = rej;
        })
    }
}