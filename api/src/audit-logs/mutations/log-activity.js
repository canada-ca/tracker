export const logActivity = async ({
  trx,
  query,
  initiatedBy = {
    id: '',
    userName: '',
    role: '', // permission level of user
    organization: '', // org affiliation of user
  },
  action = '',
  target = {
    resource: '', // name of resource being acted upon
    organization: '', // affiliated org (optional)
    resourceType: '', // user, org, domain
  },
  reason = '',
  status = '',
}) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    initiatedBy,
    target,
    status,
    action,
    reason,
  }

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
    console.error(
      `Transaction step error occurred while attempting to log user action: ${err}`,
    )
  }

  try {
    await trx.commit()
  } catch (err) {
    console.error(
      `Transaction commit error occurred while attempting to log user action: ${err}`,
    )
  }

  return { initiatedBy, target, status, action, reason }
}
