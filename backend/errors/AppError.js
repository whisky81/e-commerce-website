
class AppError extends Error {
    constructor(message, statusCode, errorCode) {
        // this.message
        // this.stack
        super(message);
        
        this.name = 'AppError';
        this.statusCode     = statusCode;
        this.errorCode      = errorCode;
        this.isOperational  = true;
        this.timestamp      = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }

    toObject() {
        return {
            success: false,
            errorCode: this.errorCode,
            message: this.message 
        }
    }
}

export default AppError;