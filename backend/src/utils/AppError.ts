/**
 * Operational error with an HTTP status code + machine-readable code.
 *
 * The global error middleware reads `err.statusCode` / `err.code`, so throwing
 * an AppError yields a correct HTTP response (e.g. 401 "Invalid email or
 * password") instead of a generic 500 "Internal Server Error" that the frontend
 * renders as "Something went wrong".
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode = 400, code = 'ERROR') {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        // Restore prototype chain (needed when targeting ES5/commonjs).
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export default AppError;
