import { loadAdditionalFindingsConnectionsByDomainId, loadTop25Reports } from './loaders'

export class AdditionalFindingsDataSource {
  constructor({ query, userKey, cleanseInput, i18n, language }) {
    this.getConnectionsByDomainId = loadAdditionalFindingsConnectionsByDomainId({ query, userKey, cleanseInput, i18n })
    this.getTop25Reports = loadTop25Reports({ query, userKey, i18n, language })
  }
}
