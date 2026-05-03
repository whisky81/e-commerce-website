import AppError from "./AppError.js";

class CastError extends AppError {
    constructor(message) {
        super(message, 400, 'INVALID_FORMAT');
        this.name = 'CastError';
    }
}

export default CastError;