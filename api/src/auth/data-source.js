import { loadPermissionByOrgId, loadDomainPermissionByDomainId, loadOrgOwnerByOrgId } from './loaders'

export class AuthDataSource {
  constructor({ query, userKey, i18n }) {
    this.permissionByOrgId = loadPermissionByOrgId({ query, userKey, i18n })
    this.domainPermissionByDomainId = loadDomainPermissionByDomainId({ query, userKey, i18n })
    this.orgOwnerByOrgId = loadOrgOwnerByOrgId({ query, userKey, i18n })
  }
}
