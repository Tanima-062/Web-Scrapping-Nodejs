import { createLogger, format, transports } from 'winston';

const simpleLogger = createLogger({
    format: format.combine(
        format.colorize(),
        format.simple()
    ),
    level: process.env.LOG_LEVEL || 'info',
    transports: [new transports.Console()],
});

export default simpleLogger;
