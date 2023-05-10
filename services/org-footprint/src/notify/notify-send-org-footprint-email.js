const { NOTIFICATION_ORG_FOOTPRINT_EMAIL_ID } = process.env

export const sendOrgFootprintEmail = async ({ notifyClient, user, auditLogs }) => {
  const templateId = NOTIFICATION_ORG_FOOTPRINT_EMAIL_ID
  try {
    await notifyClient.sendEmail(templateId, user.email, {
      personalisation: {
        user: user.displayName,
        changes: auditLogs,
      },
    })
  } catch (err) {
    console.error(`Error occurred when sending authentication code via email for ${user._key}: ${err}`)
    // throw new Error(`Unable to send authentication email. Please try again.`)
  }
}
