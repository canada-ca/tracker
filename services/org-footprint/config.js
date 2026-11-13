/** Error thrown by buildConfig when required configuration is missing or empty. */
class ConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigError'
  }
}

const REQUIRED = {
  DB_URL: (c) => c.db.url,
  DB_PASS: (c) => c.db.rootPassword,
  DB_NAME: (c) => c.db.name,
  NOTIFICATION_API_KEY: (c) => c.notify.apiKey,
  NOTIFICATION_API_URL: (c) => c.notify.apiUrl,
  NOTIFICATION_PENDING_USERS: (c) => c.notify.templates.pendingUsers,
  NOTIFICATION_ORG_FOOTPRINT_BILINGUAL: (c) => c.notify.templates.orgFootprint,
  NOTIFICATION_NEW_CVD_ENROLLMENTS: (c) => c.notify.templates.cvdEnrollment,
  SERVICE_ACCOUNT_EMAIL: (c) => c.serviceAccount,
}

function assertValid(config) {
  const missing = Object.keys(REQUIRED).filter((name) => !REQUIRED[name](config))
  if (missing.length > 0) throw new ConfigError(`Missing required config: ${missing.join(', ')}`)
}

/**
 * Builds the nested service config from environment variables.
 * @param {Object<string, string|undefined>} [env=process.env] - Environment variables to read.
 * @returns {{nodeEnv: string, logLevel: string, serviceAccount: string, redirect: boolean, logTimeWindow: number,
 *   db: {rootPassword: string, url: string, name: string},
 *   notify: {apiKey: string, apiUrl: string, adminLink: string,
 *     templates: {pendingUsers: string, orgFootprint: string, cvdEnrollment: string}}}} The parsed config.
 * @throws {ConfigError} If any required value is missing or empty. The message lists variable names only, never values.
 */
function buildConfig(env = process.env) {
  const {
    DB_PASS,
    DB_URL,
    DB_NAME,
    NOTIFICATION_API_KEY,
    NOTIFICATION_API_URL,
    NOTIFICATION_PENDING_USERS,
    NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
    SERVICE_ACCOUNT_EMAIL,
    REDIRECT_TO_SERVICE_ACCOUNT_EMAIL,
    NOTIFICATION_NEW_CVD_ENROLLMENTS,
    LOG_LEVEL,
    NODE_ENV,
    NOTIFICATION_ADMIN_LINK,
  } = env

  const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24

  const config = {
    nodeEnv: NODE_ENV,
    logLevel: LOG_LEVEL || 'info',
    serviceAccount: SERVICE_ACCOUNT_EMAIL,
    redirect: REDIRECT_TO_SERVICE_ACCOUNT_EMAIL?.toLowerCase() === 'true',
    logTimeWindow: TWENTY_FOUR_HOURS,
    db: {
      rootPassword: DB_PASS,
      url: DB_URL,
      name: DB_NAME,
    },
    notify: {
      apiKey: NOTIFICATION_API_KEY,
      apiUrl: NOTIFICATION_API_URL,
      adminLink: NOTIFICATION_ADMIN_LINK || 'https://tracker.canada.ca/admin/organizations',
      templates: {
        pendingUsers: NOTIFICATION_PENDING_USERS,
        orgFootprint: NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
        cvdEnrollment: NOTIFICATION_NEW_CVD_ENROLLMENTS,
      },
    },
  }

  assertValid(config)
  return config
}

module.exports = {
  buildConfig,
  ConfigError,
}
