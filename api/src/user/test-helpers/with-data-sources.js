import { UserDataSource } from '../data-source'

export const withDataSources = (contextValue = {}) => {
  const loaders = contextValue.loaders || {}

  const fallbackI18n = {
    _: (value) => (typeof value === 'string' ? value : String(value)),
  }

  const fallbackTransaction = async () => ({
    step: async () => undefined,
    commit: async () => undefined,
    abort: async () => undefined,
  })

  const fallbackQuery = async () => ({
    count: 0,
    next: async () => undefined,
    all: async () => [],
  })

  const baseUserDataSource = new UserDataSource({
    query: contextValue.query || fallbackQuery,
    userKey: contextValue.userKey,
    i18n: contextValue.i18n || fallbackI18n,
    language: contextValue.language || 'en',
    cleanseInput: contextValue.validators?.cleanseInput || ((value) => value),
    transaction: contextValue.transaction || fallbackTransaction,
    collections: contextValue.collections || {},
  })

  const userDataSource = contextValue.dataSources?.user
    ? Object.assign(baseUserDataSource, contextValue.dataSources.user)
    : baseUserDataSource

  if (contextValue.i18n) userDataSource._i18n = contextValue.i18n

  if (loaders.loadUserByKey) userDataSource.byKey = loaders.loadUserByKey
  if (loaders.loadUserByUserName) userDataSource.byUserName = loaders.loadUserByUserName
  if (loaders.loadMyTrackerByUserId) userDataSource.myTrackerByUserId = loaders.loadMyTrackerByUserId
  if (loaders.loadUserConnectionsByUserId) userDataSource.connectionsByUserId = loaders.loadUserConnectionsByUserId

  const dataSources = {
    ...(contextValue.dataSources || {}),
    user: userDataSource,
  }

  if (loaders.loadOrgByKey) {
    dataSources.organization = {
      byKey: {
        load: async (orgKey) => {
          const org = await loaders.loadOrgByKey.load(orgKey)

          if (!org) return org
          if (org._id) return org

          return {
            ...org,
            _id: org._key ? `organizations/${org._key}` : org._id,
          }
        },
      },
    }
  }

  return { ...contextValue, dataSources }
}
