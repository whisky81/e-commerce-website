import {v4 as uuidv4} from 'uuid';
import logger from "../config/Logger.js";

const requestLogger = (req, res, next) => {
    req.requestId = req.headers['x-request-id'] || uuidv4();
    req.startTime = Date.now();
    res.setHeader('x-request-id', req.requestId);

    logger.info("Incoming request", {
        requestId: req.requestId,
        method: req.method,
        path: req.baseUrl + req.path,
        ip: req.ip
    });

    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        const level = res.statusCode >= 400 ? 'warn' : 'info';
        logger[level]("Request completed", {
            requestId: req.requestId,
            duration: `${duration} ms`,
            statusCode: res.statusCode,
            path: req.baseUrl + req.path 
        });
        if (duration > 1000) {
            logger.warn('Slow request', {
                path: req.baseUrl + req.path,
                duration: `${duration} ms`
            });
        }
    });

    next();
}

export default requestLogger;