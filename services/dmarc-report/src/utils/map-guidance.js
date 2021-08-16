const mapGuidance = (guidance) => {
  switch (guidance) {
    case 'agg-spf-no-record':
      return 'agg1'
    case 'agg-spf-invalid':
      return 'agg2'
    case 'agg-spf-failed':
      return 'agg3'
    case 'agg-spf-mismatch':
      return 'agg4'
    case 'agg-spf-strict':
      return 'agg5'
    case 'agg-dkim-unsigned':
      return 'agg6'
    case 'agg-dkim-invalid':
      return 'agg7'
    case 'agg-dkim-failed':
      return 'agg8'
    case 'agg-dkim-mismatch':
      return 'agg9'
    case 'agg-dkim-strict':
      return 'agg10'
    default:
      return guidance
  }
}

module.exports = {
  mapGuidance,
}
