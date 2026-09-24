import { loadAdditionalFindingsByDomainId } from './loaders'

export class AdditionalFindingsDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.getByDomainId = loadAdditionalFindingsByDomainId({ query, userKey, cleanseInput, i18n })
  }
}
