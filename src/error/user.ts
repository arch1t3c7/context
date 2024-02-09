/* eslint-disable @typescript-eslint/no-explicit-any */
export class UserError extends Error {
    meta?: any;
    code?: string;
    inner?: Error;

    constructor(message: string, meta?: any, code?: string, inner?: Error) {
        super(message);

        this.meta = meta;
        this.code = code;
        this.inner = inner;
    }
}
