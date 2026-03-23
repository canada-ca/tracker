import { loadDnsByKey, loadDnsConnectionsByDomainId } from '../loaders'

export class DnsScanDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.byKey = loadDnsByKey({ query, userKey, i18n })
    this.getConnectionsByDomainId = loadDnsConnectionsByDomainId({ query, userKey, cleanseInput, i18n })
  }
}
