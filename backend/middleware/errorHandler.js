import CastError from "../errors/CastError.js";
import ValidationError from "../errors/ValidationError.js";
import DuplicateError from "../errors/DuplicateKeyError.js";
import logger from "../config/Logger.js";

const errorHandler = (err, req, res, next) => {
    if (err.isOperational) {
        logger.warn('Operational Error', {
            requestId: req.requestId,
            errorCode: err.errorCode,
            ip: req.ip,
            user: req.user?.id || "unauthenticated",
            method: req.method,
            path: req.path 
        });
    } else {
        logger.logError(err, {
            requestId: req.requestId,
            method: req.method,
            path: req.path 
        });
    }
    // app error 
    if (err.isOperational) {
        return res.status(err.statusCode).json(err.toObject());
    }

    // mongoose
    if (err.name === "CastError") {
        const cerr = new CastError(`Invalid ${err.path}: "${err.value}" is not a valid ${err.kind}`);
        return res.status(cerr.statusCode).json(cerr.toObject());
    } else if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message).join(", ");
        const verr = new ValidationError(messages);
        return res.status(verr.statusCode).json(verr.toObject());
    } else if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const derr = new DuplicateError(`${field} already exists`);
        return res.status(derr.statusCode).json(derr.toObject());
    }
    
    // json web token
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            errorCode: 'INVALID_TOKEN',
            message: 'Invalid token'
        })
    } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            errorCode: 'TOKEN_EXPIRED',
            message: 'Token expired'
        });
    }

    // programmer error || unknown error 
    return res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message 
    })
}

export default errorHandler;
