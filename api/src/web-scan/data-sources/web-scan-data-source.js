import { loadWebConnectionsByDomainId, loadWebScansByWebId } from '../loaders'

export class WebScanDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.getConnectionsByDomainId = loadWebConnectionsByDomainId({ query, userKey, cleanseInput, i18n })
    this.getScansByWebId = loadWebScansByWebId({ query, userKey, cleanseInput, i18n })
  }
}
