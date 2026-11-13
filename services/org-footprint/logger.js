const pino = require('pino')

/**
 * Creates the service's pino logger.
 * @param {{level: string, env: string}} options - Minimum log level and environment name added to every entry.
 * @returns {import('pino').Logger} A logger that writes JSON with an ISO timestamp, a `message` key and an `err` key.
 * @throws {Error} If pino rejects the given level.
 */
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
