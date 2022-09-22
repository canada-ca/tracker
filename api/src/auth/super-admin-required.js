import {t} from '@lingui/macro'

export const superAdminRequired =
  ({i18n}) =>
    ({user, isSuperAdmin}) => {
      if (isSuperAdmin) {
        return true
      }

      console.warn(
        `User: ${user._key} attempted to access controlled functionality without sufficient priveleges.`,
      )
      throw new Error(
        i18n._(
          t`Permissions error. You do not have sufficient permissions to access this data.`,
        ),
      )
    }
