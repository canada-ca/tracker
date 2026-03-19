// Central RBAC definition using accesscontrol
//
// This file defines role-based access control (RBAC) permissions using the AccessControl library.
//
// "Own" refers to resources affiliated with the user's organization. For example, an admin can create domains
// in their affiliated organization, but not in other organizations. This ensures users only manage resources
// within their scope of affiliation.
//
// Roles:
// - user: Basic permissions for managing own CSVs, affiliations, scan requests, and viewing own organization.
// - admin: Extends user. Can manage domains, organizations, logs, tags, and affiliations within their own org.
// - owner: Extends admin. Can delete own organization and create domains.
// - super_admin: Extends owner. Can manage any resource across all organizations.
//
// For maintainability, update permissions here when adding new roles or resources.

import AccessControl from 'accesscontrol'

const ac = new AccessControl()

ac.grant('user').createOwn('csv').readOwn('affiliation').createOwn('scan-request').readOwn('organization')

ac.grant('admin')
  .extend('user')
  .createOwn('domain')
  .updateOwn('domain', ['*', '!archived'])
  .deleteOwn('domain')
  .updateOwn('organization', ['*', '!externalId', '!externallyManaged'])
  .readOwn('log')
  .createOwn('tag')
  .updateOwn('tag')
  .createOwn('affiliation')
  .updateOwn('affiliation')
  .deleteOwn('affiliation')

ac.grant('owner').extend('admin').deleteOwn('organization')

ac.grant('super_admin')
  .extend('owner')
  .createAny(['organization', 'domain', 'user', 'tag', 'affiliation', 'csv', 'scan-request'])
  .readAny(['organization', 'domain', 'user', 'tag', 'log', 'affiliation'])
  .updateAny(['organization', 'domain', 'user', 'tag', 'affiliation'])
  .deleteAny(['organization', 'domain', 'user', 'tag', 'affiliation'])

ac.lock()

export default ac
