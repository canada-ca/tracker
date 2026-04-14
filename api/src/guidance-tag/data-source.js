import {
  loadAggregateGuidanceTagByTagId,
  loadAggregateGuidanceTagConnectionsByTagId,
  loadDkimGuidanceTagByTagId,
  loadDkimGuidanceTagConnectionsByTagId,
  loadDmarcGuidanceTagByTagId,
  loadDmarcGuidanceTagConnectionsByTagId,
  loadGuidanceTagByTagId,
  loadGuidanceTagSummaryConnectionsByTagId,
  loadHttpsGuidanceTagByTagId,
  loadHttpsGuidanceTagConnectionsByTagId,
  loadSpfGuidanceTagByTagId,
  loadSpfGuidanceTagConnectionsByTagId,
  loadSslGuidanceTagByTagId,
  loadSslGuidanceTagConnectionsByTagId,
} from './loaders'

export class GuidanceTagDataSource {
  constructor({ query, userKey, i18n, language, cleanseInput }) {
    this.byTagId = loadGuidanceTagByTagId({ query, userKey, i18n, language })
    this.summaryConnectionsByTagId = loadGuidanceTagSummaryConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.aggregateByTagId = loadAggregateGuidanceTagByTagId({ query, userKey, i18n, language })
    this.aggregateConnectionsByTagId = loadAggregateGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.dkimByTagId = loadDkimGuidanceTagByTagId({ query, userKey, i18n, language })
    this.dkimConnectionsByTagId = loadDkimGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.dmarcByTagId = loadDmarcGuidanceTagByTagId({ query, userKey, i18n, language })
    this.dmarcConnectionsByTagId = loadDmarcGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.httpsByTagId = loadHttpsGuidanceTagByTagId({ query, userKey, i18n, language })
    this.httpsConnectionsByTagId = loadHttpsGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.spfByTagId = loadSpfGuidanceTagByTagId({ query, userKey, i18n, language })
    this.spfConnectionsByTagId = loadSpfGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
    this.sslByTagId = loadSslGuidanceTagByTagId({ query, userKey, i18n, language })
    this.sslConnectionsByTagId = loadSslGuidanceTagConnectionsByTagId({ query, userKey, cleanseInput, i18n, language })
  }
}
