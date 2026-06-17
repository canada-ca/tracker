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
}
