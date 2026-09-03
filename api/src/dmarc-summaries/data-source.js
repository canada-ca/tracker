import {
  loadAllVerifiedRuaDomains,
  loadDkimFailConnectionsBySumId,
  loadDmarcFailConnectionsBySumId,
  loadDmarcSummaryByKey,
  loadDmarcSummaryConnectionsByUserId,
  loadDmarcSummaryEdgeByDomainIdAndPeriod,
  loadDmarcYearlySumEdge,
  loadFullPassConnectionsBySumId,
  loadSpfFailureConnectionsBySumId,
  loadStartDateFromPeriod,
} from './loaders'

export class DmarcSummariesDataSource {
  constructor({ query, userKey, i18n, cleanseInput, moment, loginRequiredBool }) {
    this.byKey = loadDmarcSummaryByKey({ query, userKey, i18n })
    this.startDateFromPeriod = loadStartDateFromPeriod({ moment, userKey, i18n })
    this.summaryEdgeByDomainIdAndPeriod = loadDmarcSummaryEdgeByDomainIdAndPeriod({ query, userKey, i18n })
    this.yearlySumEdges = loadDmarcYearlySumEdge({ query, userKey, i18n })
    this.connectionsByUserId = loadDmarcSummaryConnectionsByUserId({
      query,
      userKey,
      cleanseInput,
      i18n,
      auth: { loginRequiredBool },
      loadStartDateFromPeriod: this.startDateFromPeriod,
    })
    this.dkimFailConnectionsBySumId = loadDkimFailConnectionsBySumId({ query, userKey, cleanseInput, i18n })
    this.dmarcFailConnectionsBySumId = loadDmarcFailConnectionsBySumId({ query, userKey, cleanseInput, i18n })
    this.fullPassConnectionsBySumId = loadFullPassConnectionsBySumId({ query, userKey, cleanseInput, i18n })
    this.spfFailureConnectionsBySumId = loadSpfFailureConnectionsBySumId({ query, userKey, cleanseInput, i18n })
    this.allVerifiedRuaDomains = loadAllVerifiedRuaDomains({ query, userKey, i18n })
  }
}
