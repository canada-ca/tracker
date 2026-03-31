const getPendingCvdEnrollmentCount = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            FILTER v.cvdEnrollment.status == "pending"
            RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find pending enrollments: ${err}`)
  }

  let pendingEnrollmentCount
  try {
    pendingEnrollmentCount = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find pending enrollments: ${err}`)
  }

  return pendingEnrollmentCount.length
}

module.exports = {
  getPendingCvdEnrollmentCount,
}
