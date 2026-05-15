import AppError from "./AppError.js";

class MissingRequiredFieldError extends AppError {
    constructor(message) {
        super(message, 400, 'MISSING_REQUIRED_FIELDS');
        this.name = 'MissingRequiredFieldError';
    }
}

export default MissingRequiredFieldError;