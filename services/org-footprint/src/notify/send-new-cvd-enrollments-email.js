async function sendNewCVDEnrollmentsEmail({ client, templateId, payload, email }) {
  try {
    await client.sendMail(templateId, email, {
      personalisation: { ...payload },
    })
  } catch (err) {
    throw new Error('Failed to send new CVD enrollments email', { cause: err })
  }
}

module.exports = {
  sendNewCVDEnrollmentsEmail,
}
