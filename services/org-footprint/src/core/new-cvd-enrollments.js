const hasEnrollmentUpdate = (log) =>
  Boolean(log.target?.organization) &&
  Array.isArray(log.target.updatedProperties) &&
  log.target.updatedProperties.some((prop) => prop.name === 'cvdEnrollment')

function getNewlyEnrolledDomains(logs) {
  return logs.filter(hasEnrollmentUpdate)
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

/**
 * Builds the email payload for domains that enrolled in CVD.
 * Logs without a `target.organization` or a `target.updatedProperties` array are skipped.
 * @param {Array<object>} logs - Domain update audit logs.
 * @returns {{enrollments_table: string, enrollments_count: number}|null} A markdown table and row count,
 *   or null when no log contains a `cvdEnrollment` update.
 */
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
