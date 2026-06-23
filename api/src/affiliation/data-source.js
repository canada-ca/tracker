import {
  loadAffiliationByKey,
  loadAffiliationConnectionsByOrgId,
  loadAffiliationConnectionsByUserId,
} from './loaders'

export class AffiliationDataSource {
  constructor({ query, userKey, i18n, language, cleanseInput, transaction, collections }) {
    this._query = query
    this._transaction = transaction
    this._collections = collections

    this.byKey = loadAffiliationByKey({ query, userKey, i18n })
    this.connectionsByUserId = loadAffiliationConnectionsByUserId({
      query,
      language,
      userKey,
      cleanseInput,
      i18n,
    })
    this.connectionsByOrgId = loadAffiliationConnectionsByOrgId({
      query,
      userKey,
      cleanseInput,
      i18n,
    })
  }

  async affiliationByOrgAndUser({ orgId, userId }) {
    let affiliationCursor
    try {
      affiliationCursor = await this._query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
          FILTER e._to == ${userId}
          RETURN e
      `
    } catch (err) {
      err.affiliationDataSourceOp = 'query'
      throw err
    }

    if (affiliationCursor.count < 1) {
      return undefined
    }

    try {
      return await affiliationCursor.next()
    } catch (err) {
      err.affiliationDataSourceOp = 'cursor'
      throw err
    }
  }

  async createAffiliation({ orgId, userId, permission }) {
    const transaction = await this._transaction(this._collections)

    try {
      await transaction.step(
        () =>
          this._query`
            WITH affiliations, organizations, users
            INSERT {
              _from: ${orgId},
              _to: ${userId},
              permission: ${permission},
            } INTO affiliations
          `,
      )
    } catch (err) {
      if (typeof transaction.abort === 'function') await transaction.abort()
      err.affiliationDataSourceOp = 'trx-step'
      throw err
    }

    try {
      await transaction.commit()
    } catch (err) {
      if (typeof transaction.abort === 'function') await transaction.abort()
      err.affiliationDataSourceOp = 'trx-commit'
      throw err
    }
  }

  async createPendingAffiliation({ orgId, userId }) {
    return this.createAffiliation({ orgId, userId, permission: 'pending' })
  }

  async updateAffiliationPermission({ affiliationKey, orgId, userId, permission }) {
    const trx = await this._transaction(this._collections)

    const edge = {
      _from: orgId,
      _to: userId,
      permission,
    }

    try {
      await trx.step(
        async () =>
          await this._query`
            WITH affiliations, organizations, users
            UPSERT { _key: ${affiliationKey} }
              INSERT ${edge}
              UPDATE ${edge}
              IN affiliations
          `,
      )
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-step'
      throw err
    }

    try {
      await trx.commit()
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-commit'
      throw err
    }
  }

  async removeAffiliation({ orgId, userId }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () =>
          this._query`
            WITH affiliations, organizations, users
            FOR aff IN affiliations
              FILTER aff._from == ${orgId}
              FILTER aff._to == ${userId}
              REMOVE aff IN affiliations
              RETURN true
        `,
      )
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-step'
      throw err
    }

    try {
      await trx.commit()
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-commit'
      throw err
    }
  }

  async transferOrgOwnership({ orgId, fromUserId, toUserId }) {
    const trx = await this._transaction(this._collections)

    try {
      await trx.step(
        () =>
          this._query`
            WITH affiliations, organizations, users
            FOR aff IN affiliations
              FILTER aff._from == ${orgId}
              FILTER aff._to == ${fromUserId}
              UPDATE { _key: aff._key } WITH {
                permission: "admin",
              } IN affiliations
              RETURN aff
        `,
      )
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-step'
      throw err
    }

    try {
      await trx.step(
        () =>
          this._query`
            WITH affiliations, organizations, users
            FOR aff IN affiliations
              FILTER aff._from == ${orgId}
              FILTER aff._to == ${toUserId}
              UPDATE { _key: aff._key } WITH {
                permission: "owner",
              } IN affiliations
              RETURN aff
        `,
      )
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-step'
      throw err
    }

    try {
      await trx.commit()
    } catch (err) {
      if (typeof trx.abort === 'function') await trx.abort()
      err.affiliationDataSourceOp = 'trx-commit'
      throw err
    }
  }

  async orgAdminUserKeys({ orgId }) {
    let orgAdminsCursor
    try {
      orgAdminsCursor = await this._query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
          FILTER e.permission IN ["admin", "owner", "super_admin"]
          RETURN v._key
      `
    } catch (err) {
      err.affiliationDataSourceOp = 'query'
      throw err
    }

    try {
      return await orgAdminsCursor.all()
    } catch (err) {
      err.affiliationDataSourceOp = 'cursor'
      throw err
    }
  }
}
