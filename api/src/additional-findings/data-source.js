import { loadAdditionalFindingsByDomainId, loadTop25Reports } from './loaders'

export class AdditionalFindingsDataSource {
  constructor({ query, userKey, cleanseInput, i18n, language }) {
    this.getByDomainId = loadAdditionalFindingsByDomainId({ query, userKey, cleanseInput, i18n })
  }
}
