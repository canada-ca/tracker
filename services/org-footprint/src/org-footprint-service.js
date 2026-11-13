const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
  getOrgUsers,
  getNewDomainUpdateLogs,
} = require('./database')
const {
  buildOrgFootprintPayload,
  addServiceAccountToRecipients,
  buildNewEnrollmentEmailPayload,
  buildPendingUsersPayload,
} = require('./core')

/**
 * Sends org footprint, pending user, and new CVD enrollment emails for every organization.
 * A failure for one organization or one email is logged and counted, and the run continues.
 * @param {{config: object, logger: object, query: Function, notifyClient: object}} params - Config from buildConfig,
 *   a pino-style logger, a tagged-template query function, and a Notify client with `sendEmail`.
 * @returns {Promise<number>} The number of failed organizations or emails. Zero means full success.
 * @throws {Error} If the list of organization keys cannot be fetched.
 */
const orgFootprintService = async ({ config, logger, query, notifyClient }) => {
  const args = { config, logger, query, notifyClient }
  const orgKeys = await getAllOrgKeys({ query })
  let failures = 0

  for (const orgKey of orgKeys) {
    let orgNames
    try {
      orgNames = await getBilingualOrgNames({ query, orgKey })
    } catch (err) {
      logger.error({ orgKey, err }, 'Failed to fetch org names, skipping org...')
      failures += 1
      continue
    }

    const orgArgs = { orgKey, orgNames, ...args }

    try {
      failures += await processOrgFootprints(orgArgs)
    } catch (err) {
      logger.error({ err, orgKey }, 'Failed to process org footprint notification.')
      failures += 1
    }

    try {
      failures += await processPendingUsers(orgArgs)
    } catch (err) {
      logger.error({ err, orgKey }, 'Failed to process pending users notifications.')
      failures += 1
    }
  }

  try {
    failures += await processNewCVDEnrollments(args)
  } catch (err) {
    logger.error({ err }, 'Failed to process new CVD enrollments notifications.')
    failures += 1
  }

  if (failures > 0) logger.warn({ failures }, 'Run completed with failures')
  return failures
}

async function processOrgFootprints({ config, query, logger, orgKey, orgNames, notifyClient }) {
  const { redirect, serviceAccount } = config
  const logs = await getNewAuditLogs({ query, orgKey, window: config.logTimeWindow })
  const payload = buildOrgFootprintPayload({ logs, orgNames })
  if (!payload) {
    logger.info('No new asset change logs, skipping org footprint email')
    return 0
  }

  let users = await getOrgUsers({ query, orgKey })
  users = addServiceAccountToRecipients({ users, redirect, serviceAccount })

  logger.info({ orgKey }, 'Sending recent activity email to admins of org')
  let failedSends = 0
  for (const user of users) {
    const sent = await sendNotification({
      notifyClient,
      templateId: config.notify.templates.orgFootprint,
      user,
      logger,
      payload: { display_name: user.displayName, ...payload },
      errorMessage: 'Error occurred when sending org footprint changes via email',
    })
    if (!sent) failedSends += 1
  }
  return failedSends
}

async function processPendingUsers({ config, query, logger, orgKey, notifyClient, orgNames }) {
  const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
  if (pendingUserCount === 0) {
    logger.info({ orgKey }, 'No pending user invite requests in org.')
    return 0
  }

  logger.info({ orgKey, pendingUserCount }, 'Sending pending users email to admins of org')
  const orgAdmins = await getOrgAdmins({ query, orgKey })
  let failedSends = 0
  for (const user of orgAdmins) {
    const payload = buildPendingUsersPayload({ user, orgNames, adminLink: config.notify.adminLink })
    const sent = await sendNotification({
      notifyClient,
      templateId: config.notify.templates.pendingUsers,
      logger,
      user,
      payload,
      errorMessage: 'Error occurred when sending pending users alert via email',
    })
    if (!sent) failedSends += 1
  }
  return failedSends
}

async function processNewCVDEnrollments({ query, logger, notifyClient, config }) {
  const newDomainUpdateLogs = await getNewDomainUpdateLogs({ query, window: config.logTimeWindow })
  const payload = buildNewEnrollmentEmailPayload(newDomainUpdateLogs)
  if (!payload) {
    logger.info('No new CVD enrollments, skipping email')
    return 0
  }
  const sent = await sendNotification({
    logger,
    notifyClient,
    templateId: config.notify.templates.cvdEnrollment,
    user: { userName: config.serviceAccount, _key: 'service-account' },
    payload,
    errorMessage: 'Failed to send new CVD enrollments email',
  })
  return sent ? 0 : 1
}

/**
 * Sends one templated email through the Notify client.
 * Errors are logged and not thrown.
 * @param {{notifyClient: object, templateId: string, logger: object, user: {userName: string, _key: string},
 *   payload: object, errorMessage?: string}} params - Client, template, recipient, personalisation values,
 *   and the message to log on failure.
 * @returns {Promise<boolean>} True when the email was sent, false when sending failed.
 */
const sendNotification = async ({
  notifyClient,
  templateId,
  logger,
  user,
  payload,
  errorMessage = 'Failed to send email',
}) => {
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: payload,
    })
    return true
  } catch (err) {
    logger.error({ err, userKey: user._key }, errorMessage)
    return false
  }
}

module.exports = {
  orgFootprintService,
}
