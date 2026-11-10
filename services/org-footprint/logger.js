const pino = require('pino')

function createLogger({ level, env }) {
  return pino({
    level,
    base: {
      service: 'org-footprint',
      env,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    errorKey: 'err',
  })
}

module.exports = { createLogger }
