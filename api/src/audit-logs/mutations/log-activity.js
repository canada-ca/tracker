export const logActivity = async ({
  transaction,
  collections,
  query,
  initiatedBy = {
    id: '',
    userName: '',
    ipAddress: '', // IP address of user
    role: '', // permission level of user
    organization: '', // org affiliation of user
  },
  action = '',
  target = {
    resource: '', // name of resource being acted upon
    organization: '', // affiliated org (optional)
    resourceType: '', // user, org, domain
    updatedProperties: [],
  },
  reason = '',
}) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    initiatedBy,
    target,
    action,
    reason,
  }

  const trx = await transaction(collections)

  try {
    await trx.step(
      () => query`
          WITH auditLogs
          INSERT ${auditLog} INTO auditLogs
          RETURN MERGE(
            {
              id: NEW._key,
              _type: "auditLog"
            },
            NEW
          )
        `,
    )
  } catch (err) {
    console.error(`Transaction step error occurred while attempting to log user action: ${err}`)
    await trx.abort()
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(`Transaction commit error occurred while attempting to log user action: ${err}`)
    await trx.abort()
  }

  return auditLog
}
