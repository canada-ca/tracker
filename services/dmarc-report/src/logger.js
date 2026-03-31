const pino = require('pino')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'dmarc-report',
    env: process.env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: 'message',
  errorKey: 'err',
})

module.exports = logger
