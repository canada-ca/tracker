import { t } from '@lingui/macro'

export const verifiedRequired =
  ({ i18n }) =>
  ({ user }) => {
    if (user.emailValidated) {
      return true
    }

    console.warn(
      `User: ${user._key} attempted to access controlled functionality without verification.`,
    )
    throw new Error(
      i18n._(
        t`Verification error. Please verify your account via email to access content.`,
      ),
    )
  }
