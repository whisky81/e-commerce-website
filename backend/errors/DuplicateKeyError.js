import AppError from "./AppError.js";

class DuplicateKeyError extends AppError {
    constructor(message) {
        super(message, 400, 'DUPLICATE_KEY');
        this.name = 'DuplicateKeyError'
    }
}

export default DuplicateKeyError;