function buildConfig() {
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
  } = process.env

  return {
    nodeEnv: NODE_ENV,
    logLevel: LOG_LEVEL || 'info',
    db: {
      rootPassword: DB_PASS,
      url: DB_URL,
      name: DB_NAME,
    },
    notify: {
      apiKey: NOTIFICATION_API_KEY,
      apiUrl: NOTIFICATION_API_URL,
      serviceAccount: SERVICE_ACCOUNT_EMAIL,
      redirect: REDIRECT_TO_SERVICE_ACCOUNT_EMAIL === 'true',
      templates: {
        pendingUsers: NOTIFICATION_PENDING_USERS,
        orgFootprint: NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
        cvdEnrollment: NOTIFICATION_NEW_CVD_ENROLLMENTS,
      },
    },
  }
}

module.exports = {
  buildConfig,
}
