import ac from '../../access-control'

// Returns the names of fields present in `args` that `permission` is not allowed
// to set on `resource`, per the grants defined in `access-control.js`. Checks both
// the "own" and "any" possession levels for `action` ('create' or 'update'), so a
// role holding an unrestricted "any" grant (e.g. super_admin) is never blocked by
// a more restrictive "own" grant it also inherits.
export const getDeniedFields = ({ permission, resource, action, args }) => {
  const ownPermission = ac.can(permission)[`${action}Own`](resource)
  const anyPermission = ac.can(permission)[`${action}Any`](resource)
  const effectivePermission = anyPermission.granted ? anyPermission : ownPermission

  // `args` from graphql-js input coercion has a null prototype; accesscontrol's
  // filter (via the `notation` package) only recognizes plain objects, so it
  // silently treats a null-prototype object as empty. Spread into a plain
  // object first so filtering actually works.
  const plainArgs = { ...args }

  return Object.keys(plainArgs).filter((field) => !(field in effectivePermission.filter(plainArgs)))
}
