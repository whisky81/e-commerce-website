
class ThirdPartyServiceError extends Error {
    constructor(message, serviceName) {
        super(message);
        this.name = 'ThirdPartyServiceError';
        this.serviceName = serviceName;
        this.isOperational  = false;
        this.timestamp      = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }

    toObject() {
        return {
            message: this.message,
            stack: this.stack,
            serviceName: this.serviceName
        }
    }
}

export default ThirdPartyServiceError;