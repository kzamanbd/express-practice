require('winston-mongodb');
require('winston-daily-rotate-file');
const { createLogger, format, transports } = require('winston');
const expressWinston = require('express-winston');
const { ElasticsearchTransport } = require('winston-elasticsearch');

const path = require('path');

const logFormat = format.printf(
    ({ level, message, timestamp, stack }) => `${timestamp}: ${level} - ${stack || message}`
);
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'blue',
    http: 'green',
    verbose: 'cyan',
    debug: 'white'
};

const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.colorize({ colors }),
        format.timestamp({ format: 'DD/MM/YYYY || HH:mm:ss' }),
        format.errors({ stack: true }),
        logFormat
    ),
    transports: [new transports.Console()]
});

const fileTransport = new transports.DailyRotateFile({
    filename: 'application-info-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    dirname: path.resolve(__dirname, '../storage/logs')
});

const HOST = process.env.ELASTICSEARCH_HOST || 'http://localhost:9200';

const esTransportOpts = {
    level: 'info',
    clientOpts: { node: HOST },
    indexPrefix: 'log-express'
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

const fileErrorTransport = new transports.DailyRotateFile({
    filename: 'application-error-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    dirname: path.resolve(__dirname, '../storage/logs')
});

const mongoErrorTransport = new transports.MongoDB({
    db: process.env.MONGO_URI,
    metaKey: 'meta',
    collection: 'logs'
});

const getLogMessage = (req, res) => {
    const msgObj = {
        correlationId: req.headers['x-correlation-id'],
        requestBody: req.body
    };

    return JSON.stringify(msgObj);
};

const infoLogger = expressWinston.logger({
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.cli({ colors })),
            handleExceptions: true
        }),
        fileTransport,
        esTransport
    ],
    format: format.combine(format.colorize(), format.json()),
    meta: false,
    msg: getLogMessage
});

const errorLogger = expressWinston.errorLogger({
    transports: [
        new transports.Console({
            format: format.combine(format.colorize(), format.cli({ colors })),
            handleExceptions: true
        }),
        fileErrorTransport,
        mongoErrorTransport,
        esTransport
    ],
    format: format.combine(format.colorize(), format.json()),
    meta: true,
    msg: '{ "correlationId": "{{req.headers["x-correlation-id"]}}", "error" : "{{err.message}}" }',
    correlationId: "{{req.headers['x-correlation-id']}}"
});

module.exports = {
    logger,
    infoLogger,
    errorLogger
};
