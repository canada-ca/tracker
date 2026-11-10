function getNewlyEnrolledDomains(logs) {
  return logs.filter((log) => log.target.updatedProperties.some((prop) => prop.name === 'cvdEnrollment'))
}

const escapeCell = (value) => String(value ?? '').replaceAll('|', '\\|')

function toRow(log) {
  const prop = log.target.updatedProperties.find((p) => p.name === 'cvdEnrollment')
  const cells = [
    log.target.resource,
    log.target.organization.name,
    log.timestamp,
    log.initiatedBy.userName,
    prop.newValue,
  ]
  return `| ${cells.map(escapeCell).join(' | ')} |`
}

function buildNewEnrollmentEmailPayload(logs) {
  const newlyEnrolledDomainLogs = getNewlyEnrolledDomains(logs)
  if (newlyEnrolledDomainLogs.length === 0) {
    return null
  }

  const HEADER = [
    '| Domain | Organization | Timestamp | Initiated by | Enrollment status |',
    '| --- | --- | --- | --- | --- |',
  ]

  const table = [...HEADER, ...newlyEnrolledDomainLogs.map(toRow)].join('\n')
  return { enrollments_table: table, enrollments_count: newlyEnrolledDomainLogs.length }
}

module.exports = {
  buildNewEnrollmentEmailPayload,
}
