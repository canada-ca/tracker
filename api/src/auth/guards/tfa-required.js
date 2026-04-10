import {t} from '@lingui/macro'

export const tfaRequired =
  ({i18n}) =>
    ({user}) => {
      if (user.tfaSendMethod !== 'none') {
        return true
      }

      console.warn(
        `User: ${user._key} attempted to access controlled functionality without multi-factor verification.`,
      )
      throw new Error(
        i18n._(
          t`Verification error. Please activate multi-factor authentication to access content.`,
        ),
      )
    }
