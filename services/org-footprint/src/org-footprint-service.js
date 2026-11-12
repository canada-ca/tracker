const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
  getOrgUsers,
  getNewDomainUpdateLogs,
} = require('./database')
const { buildOrgFootprintPayload, addServiceAccountToRecipients, buildNewEnrollmentEmailPayload } = require('./core')

const orgFootprintService = async ({ config, logger, query, notifyClient }) => {
  const args = { config, logger, query, notifyClient }
  const orgKeys = await getAllOrgKeys({ query })

  for (const orgKey of orgKeys) {
    let orgNames
    try {
      orgNames = await getBilingualOrgNames({ query, orgKey })
    } catch (err) {
      logger.error({ orgKey, err }, 'Failed to fetch org names, skipping org...')
      continue
    }

    const orgArgs = { orgKey, orgNames, ...args }

    try {
      await processOrgFootprints(orgArgs)
    } catch (err) {
      logger.error({ err, orgKey }, 'Failed to process org footprint notification.')
    }

    try {
      await processPendingUsers(orgArgs)
    } catch (err) {
      logger.error({ err, orgKey }, 'Failed to process pending users notifications.')
    }
  }

  try {
    await processNewCVDEnrollments(args)
  } catch (err) {
    logger.error({ err }, 'Failed to process new CVD enrollments notifications.')
  }
}

async function processOrgFootprints({ config, query, logger, orgKey, orgNames, notifyClient }) {
  const { redirect, serviceAccount } = config
  const logs = await getNewAuditLogs({ query, orgKey, window: config.logTimeWindow })
  const payload = buildOrgFootprintPayload({ logs, orgNames })
  if (!payload) {
    logger.info('No new asset change logs, skipping org footprint email')
    return
  }

  let users = await getOrgUsers({ query, orgKey })
  users = addServiceAccountToRecipients({ users, redirect, serviceAccount })

  logger.info({ orgKey }, 'Sending recent activity email to admins of org')
  for (const user of users) {
    await sendNotification({
      notifyClient,
      templateId: config.notify.templates.orgFootprint,
      user,
      logger,
      payload: { display_name: user.displayName, ...payload },
      errorMessage: 'Error occurred when sending org footprint changes via email',
    })
  }
}

async function processPendingUsers({ config, query, logger, orgKey, notifyClient, orgNames }) {
  const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
  if (pendingUserCount === 0) {
    logger.info({ orgKey }, 'No pending user invite requests in org.')
    return
  }

  logger.info({ orgKey, pendingUserCount }, 'Sending pending users email to admins of org')
  const orgAdmins = await getOrgAdmins({ query, orgKey })
  for (const user of orgAdmins) {
    const payload = buildPendingUsersPayload({ config, user, orgNames })
    await sendNotification({
      notifyClient,
      templateId: config.notify.templates.pendingUsers,
      logger,
      user,
      payload,
      errorMessage: 'Error occurred when sending pending users alert via email',
    })
  }
}

function buildPendingUsersPayload({ config, user, orgNames }) {
  return {
    display_name: user.displayName,
    organization_name_en: orgNames.en,
    organization_name_fr: orgNames.fr,
    admin_link: config.notify.adminLink,
  }
}

async function processNewCVDEnrollments({ query, logger, notifyClient, config }) {
  const newDomainUpdateLogs = await getNewDomainUpdateLogs({ query, window: config.logTimeWindow })
  const payload = buildNewEnrollmentEmailPayload(newDomainUpdateLogs)
  if (!payload) {
    logger.info('No new CVD enrollments, skipping email')
    return
  }
  await sendNotification({
    logger,
    notifyClient,
    templateId: config.notify.templates.cvdEnrollment,
    user: { userName: config.serviceAccount, _key: 'service-account' },
    payload,
    errorMessage: 'Failed to send new CVD enrollments email',
  })
}

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
  } catch (err) {
    logger.error({ err, userKey: user._key }, errorMessage)
  }
}

module.exports = {
  orgFootprintService,
}
