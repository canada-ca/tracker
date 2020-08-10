import { ref } from 'yup'
import { t } from '@lingui/macro'

export const fieldRequirements = {
  email: {
    required: { message: t`Email cannot be empty` },
    email: { message: t`Invalid email` },
  },
  displayName: { required: { message: t`Display name cannot be empty` } },
  password: {
    required: { message: t`Password cannot be empty` },
    min: {
      minLength: 12,
      message: t`Password must be at least 12 characters long`,
    },
  },
  confirmPassword: {
    required: { message: t`Password confirmation cannot be empty` },
    oneOf: { types: [ref('password')], message: t`Passwords must match` },
  },
  lang: {
    required: { message: t`Please choose your preferred language` },
    oneOf: { types: ['ENGLISH', 'FRENCH'], message: '' },
  },
  twoFactorCode: {
    typeError: { message: t`Verification code must only contains numbers` },
    required: { message: t`Code field must not be empty` },
  },
}
