// Central RBAC definition using accesscontrol
import AccessControl from 'accesscontrol'

const ac = new AccessControl()

ac.grant('user').createOwn('csv').readOwn('affiliation').createOwn('scan-request').readOwn('organization')

ac.grant('admin')
  .extend('user')
  .createOwn('domain', ['*', '!cvdEnrollment'])
  .updateOwn('domain', ['*', '!archived'])
  .deleteOwn('domain')
  .updateOwn('organization', ['*', '!externalId', '!externallyManaged'])
  .readOwn('log')
  .createOwn('tag')
  .updateOwn('tag')
  .createOwn('affiliation')
  .updateOwn('affiliation')
  .deleteOwn('affiliation')

ac.grant('owner').extend('admin').deleteOwn('organization').createOwn('domain')

ac.grant('super_admin')
  .extend('owner')
  .createAny(['organization', 'domain', 'user', 'tag', 'affiliation'])
  .readAny(['organization', 'domain', 'user', 'tag', 'log', 'affiliation'])
  .updateAny(['organization', 'domain', 'user', 'tag', 'affiliation'])
  .deleteAny(['organization', 'domain', 'user', 'tag', 'affiliation'])

ac.lock()

export default ac
