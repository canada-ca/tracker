import { loadAuditLogByKey, loadAuditLogsByOrgId } from './loaders'

export class AuditLogsDataSource {
  constructor({ query, userKey, cleanseInput, i18n, transaction, collections }) {
    this._query = query
    this._transaction = transaction
    this._collections = collections
    this.byKey = loadAuditLogByKey({ query, userKey, i18n })
    this.getConnectionsByOrgId = loadAuditLogsByOrgId({ query, userKey, cleanseInput, i18n })
  }

  async logActivity({ initiatedBy, action, target, reason = '' }) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      initiatedBy,
      target,
      action,
      reason,
    }

    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () => this._query`
          WITH auditLogs
          INSERT ${auditLog} INTO auditLogs
          RETURN MERGE({ id: NEW._key, _type: "auditLog" }, NEW)
        `,
      )
      await trx.commit()
    } catch (err) {
      console.error(`Transaction error occurred while attempting to log user action: ${err}`)
      await trx.abort()
    }

    return auditLog
  }
}
