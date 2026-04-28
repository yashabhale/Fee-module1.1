import mongoose from 'mongoose';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fee-management-api' },
  transports: [
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || './logs/app.log'
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      )
    })
  ]
});

if (process.env.NODE_ENV === 'development') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple()
    })
  );
}

export default logger;
