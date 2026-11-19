import { loadAdditionalFindingsConnectionsByDomainId } from './loaders'

export class AdditionalFindingsDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.getConnectionsByDomainId = loadAdditionalFindingsConnectionsByDomainId({ query, userKey, cleanseInput, i18n })
  }
}
