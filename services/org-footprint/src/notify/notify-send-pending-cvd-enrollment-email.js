const logger = require('../logger')

const { NOTIFICATION_PENDING_ENROLLMENT } = process.env

const sendPendingCvdEnrollmentEmail = async ({ notifyClient, user, orgNames }) => {
  const templateId = NOTIFICATION_PENDING_ENROLLMENT

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name_en: orgNames.en,
        organization_name_fr: orgNames.fr,
        admin_link: 'https://tracker.canada.ca/admin/organizations',
      },
    })
  } catch (err) {
    logger.error({ err, userKey: user._key }, 'Error occurred when sending pending users alert via email')
  }
}

module.exports = {
  sendPendingCvdEnrollmentEmail,
}
