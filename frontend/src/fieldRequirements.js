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
  domainUrl: {
    required: { message: t`Domain url field must not be empty` },
  },
  phoneNumber: {
    matches: {
      message: t`Phone number must be a valid phone number of the form +17895551234 (10-15 digits)`,
    },
    required: { message: t`Phone number field must not be empty` },
  },
  acronym: {
    matches: {
      regex: /^[A-Z]+(?:_[A-Z]+)*$/gm,
      message: t`Acronyms can only use upper case letters and underscores`,
    },
    max: {
      maxLength: 50,
      message: t`Acronyms must be at most 50 characters`,
    },
  },
  field: {
    required: { message: t`This field cannot be empty` },
  },
  selector: {
    required: { message: t`Selector cannot be empty` },
    matches: {
      regex: /^([\S]+)([.]_domainkey)$/gm,
      message: t`Selector must be string ending in '._domainkey'`,
    },
  },
}
