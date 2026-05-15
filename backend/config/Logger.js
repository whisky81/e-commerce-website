import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

class Logger {
    constructor() {
        if (Logger._instance) return Logger._instance;
        this._logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: process.env.SERVICE_NAME, env: process.env.NODE_ENV },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),
                new DailyRotateFile({
                    filename: 'logs/error-%DATE%.log',
                    level: 'error', maxFiles: '30d'
                }),
                new DailyRotateFile({
                    filename: 'logs/combined-%DATE%.log',
                    maxFiles: '14d'
                }),
            ],
        });
        Logger._instance = this;
    }
    info(msg, meta = {}) { this._logger.info(msg, meta); }
    error(msg, meta = {}) { this._logger.error(msg, meta); }
    warn(msg, meta = {}) { this._logger.warn(msg, meta); }
    debug(msg, meta = {}) { this._logger.debug(msg, meta); }
    logError(err, meta = {}) {
        this._logger.error(err.message, {
            ...meta, stack: err.stack,
            errorCode: err.errorCode
        });
    }
}

export default new Logger();