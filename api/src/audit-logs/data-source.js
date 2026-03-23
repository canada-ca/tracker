import { loadAuditLogByKey, loadAuditLogsByOrgId } from './loaders'

export class AuditLogsDataSource {
  constructor({ query, userKey, cleanseInput, i18n }) {
    this.byKey = loadAuditLogByKey({ query, userKey, i18n })
    this.getConnectionsByOrgId = loadAuditLogsByOrgId({ query, userKey, cleanseInput, i18n })
  }
}
