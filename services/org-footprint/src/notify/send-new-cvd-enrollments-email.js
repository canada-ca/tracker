async function sendNewCVDEnrollmentsEmail({ client, templateId, payload, email }) {
  try {
    await client.sendEmail(templateId, email, {
      personalisation: { ...payload },
    })
  } catch (err) {
    throw new Error('Failed to send new CVD enrollments email', { cause: err })
  }
}

module.exports = {
  sendNewCVDEnrollmentsEmail,
}
