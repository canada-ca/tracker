async function sendNewCVDEnrollmentsEmail({ logger, client, templateId, payload, email }) {
  try {
    await client.sendEmail(templateId, email, {
      personalisation: { ...payload },
    })
  } catch (err) {
    logger.error({ err }, 'Failed to send new CVD enrollments email')
  }
}

module.exports = {
  sendNewCVDEnrollmentsEmail,
}
