const hasEnrollmentUpdate = (log) =>
  Boolean(log.target?.organization) &&
  Array.isArray(log.target.updatedProperties) &&
  log.target.updatedProperties.some((prop) => prop.name === 'cvdEnrollment')

function getNewlyEnrolledDomains(logs) {
  return logs.filter(hasEnrollmentUpdate)
}

const HEADING_PREFIX = '# '
const BLOCK_SEPARATOR = '\n\n---\n\n'

/**
 * Makes a user-supplied value safe to place on one line of a Notify markdown email.
 * Runs of CR/LF collapse into one space, the value is trimmed, and a leading
 * `#`, `*`, `-`, `+` or `>` gets a backslash so it does not start a markdown block.
 * Null and undefined become an empty string.
 * Note: how Notify renders this backslash escape is unverified.
 * @param {*} value - The value to escape.
 * @returns {string} The escaped single-line string.
 */
const escapeMarkdownValue = (value) =>
  String(value ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .replace(/^[#*+>-]/, '\\$&')

function toBlock(log) {
  const prop = log.target.updatedProperties.find((p) => p.name === 'cvdEnrollment')
  return [
    `${HEADING_PREFIX}${escapeMarkdownValue(log.target.resource)}`,
    `* Organization: ${escapeMarkdownValue(log.target.organization.name)}`,
    `* Status: ${escapeMarkdownValue(prop.newValue)}`,
    `* Initiated by: ${escapeMarkdownValue(log.initiatedBy.userName)}`,
    `* Time: ${escapeMarkdownValue(log.timestamp)}`,
  ].join('\n')
}

/**
 * Builds the email payload for domains that enrolled in CVD.
 * Logs without a `target.organization` or a `target.updatedProperties` array are skipped.
 * Each log becomes a heading with a bullet list (organization, status, initiator, time).
 * Blocks are separated by a blank line, a `---` rule and a blank line, with no trailing rule.
 * @param {Array<object>} logs - Domain update audit logs.
 * @returns {{enrollments_list: string, enrollments_count: number}|null} Notify markdown and the
 *   block count, or null when no log contains a `cvdEnrollment` update.
 */
function buildNewEnrollmentEmailPayload(logs) {
  const newlyEnrolledDomainLogs = getNewlyEnrolledDomains(logs)
  if (newlyEnrolledDomainLogs.length === 0) {
    return null
  }

  const list = newlyEnrolledDomainLogs.map(toBlock).join(BLOCK_SEPARATOR)
  return { enrollments_list: list, enrollments_count: newlyEnrolledDomainLogs.length }
}

module.exports = {
  buildNewEnrollmentEmailPayload,
}
