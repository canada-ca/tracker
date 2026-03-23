import { loadAdditionalFindingsByDomainId, loadTop25Reports } from '../loaders'

export class AdditionalFindingsDataSource {
  constructor({ query, userKey, i18n, language }) {
    this.getByDomainId = loadAdditionalFindingsByDomainId({ query, userKey, i18n })
    this.getTop25Reports = loadTop25Reports({ query, userKey, i18n, language })
  }
}
