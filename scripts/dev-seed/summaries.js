// Pure ports of the aggregation in services/summaries/summaries.py
// (update_chart_summaries and update_org_summaries). Each `entry` is
// { domain, claims: [{ assetState, orgVerified, orgHandle }], negativeTags: [] }.

const CHARTS = {
  https: ['https'],
  dmarc: ['dmarc'],
  web_connections: ['https', 'hsts'],
  ssl: ['ssl'],
  spf: ['spf'],
  dkim: ['dkim'],
  mail: ['dmarc', 'spf', 'dkim'],
  web: ['https', 'hsts', 'ssl'],
}
const DMARC_PHASES = ['assess', 'deploy', 'enforce', 'maintain']

const isIgnored = (domain) => domain.archived === true || domain.blocked === true || domain.rcode === 'NXDOMAIN'

const hasDmarcPhase = (domain) => DMARC_PHASES.includes(domain.phase) && domain.status.dmarc !== 'info'

const emptyPhaseCounts = () => Object.fromEntries(DMARC_PHASES.map((phase) => [phase, 0]))

const withPhaseTotal = (counts) => ({ ...counts, total: DMARC_PHASES.reduce((sum, phase) => sum + counts[phase], 0) })

const scopesForEntry = ({ claims }) => {
  const approved = claims.filter((claim) => claim.assetState === 'approved')
  if (approved.length === 0) return []
  return approved.some((claim) => claim.orgVerified) ? ['all', 'verified'] : ['all']
}

const chartResult = (chartType, status) => {
  const statuses = CHARTS[chartType].map((scanType) => status[scanType])
  if (statuses.includes('fail')) return 'fail'
  const mailPassesWithoutDkim = chartType === 'mail' && status.dkim === 'info' && statuses.includes('pass')
  if (mailPassesWithoutDkim || !statuses.includes('info')) return 'pass'
  return null
}

const buildChartSummary = ({ date, scope, entries }) => {
  const charts = Object.fromEntries(
    Object.entries(CHARTS).map(([chartType, scanTypes]) => [
      chartType,
      { scan_types: scanTypes, pass: 0, fail: 0, total: 0 },
    ]),
  )
  const phases = emptyPhaseCounts()

  const inScope = entries.filter((entry) => !isIgnored(entry.domain) && scopesForEntry(entry).includes(scope))
  for (const { domain } of inScope) {
    for (const chartType of Object.keys(CHARTS)) {
      const result = chartResult(chartType, domain.status)
      if (!result) continue
      charts[chartType][result] += 1
      charts[chartType].total += 1
    }
    if (hasDmarcPhase(domain)) phases[domain.phase] += 1
  }

  return { date, scope, ...charts, dmarc_phase: withPhaseTotal(phases) }
}

const passFail = () => ({ pass: 0, fail: 0, total: 0 })

const tally = (bucket, outcome) => {
  if (!outcome) return
  bucket[outcome] += 1
  bucket.total += 1
}

const statusOutcome = (status) => (status === 'pass' || status === 'fail' ? status : null)

const allPass = (statuses) => statuses.every((status) => status === 'pass')
const anyFail = (statuses) => statuses.some((status) => status === 'fail')
const combinedOutcome = (statuses) => (allPass(statuses) ? 'pass' : anyFail(statuses) ? 'fail' : null)

const buildOrganizationSummary = ({ organizationId, orgHandle, date, entries }) => {
  const summary = {
    organization: organizationId,
    date,
    dmarc: passFail(),
    web: passFail(),
    mail: passFail(),
    https: passFail(),
    ssl: passFail(),
    spf: passFail(),
    dkim: passFail(),
    web_connections: passFail(),
  }
  const phases = emptyPhaseCounts()
  const negativeTags = {}

  const counted = entries.filter(
    ({ domain, claims }) =>
      !isIgnored(domain) &&
      claims.some((claim) => claim.orgHandle === orgHandle && claim.assetState === 'approved'),
  )
  for (const { domain, negativeTags: domainNegativeTags } of counted) {
    const { https, hsts, ssl, spf, dkim, dmarc } = domain.status
    tally(summary.https, statusOutcome(https))
    tally(summary.dmarc, statusOutcome(dmarc))
    tally(summary.ssl, statusOutcome(ssl))
    tally(summary.spf, statusOutcome(spf))
    tally(summary.dkim, statusOutcome(dkim))
    tally(summary.web_connections, combinedOutcome([https, hsts]))
    tally(summary.web, combinedOutcome([ssl, https]))
    tally(summary.mail, combinedOutcome(dkim === 'info' ? [dmarc, spf] : [dmarc, spf, dkim]))

    // summaries.py skips both the phase and negative-tag counts for domains without DMARC data.
    if (!hasDmarcPhase(domain)) continue
    phases[domain.phase] += 1
    for (const tag of domainNegativeTags) negativeTags[tag] = (negativeTags[tag] || 0) + 1
  }

  return { ...summary, dmarc_phase: withPhaseTotal(phases), negative_tags: negativeTags }
}

module.exports = { buildChartSummary, buildOrganizationSummary }
