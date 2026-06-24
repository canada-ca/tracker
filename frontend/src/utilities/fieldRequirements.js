import { array, object, ref, string } from 'yup'
import { t } from '@lingui/core/macro'
import { array as arrayProp, object as objectProp, string as stringProp } from 'prop-types'

const nonEmptyMessage = () => t`This field cannot be empty`

const getSchema = (options) => {
  return {
    email: string()
      .required(t`Email cannot be empty`)
      .email(t`Invalid email`),
    matchEmail: string()
      .required(t`Email cannot be empty`)
      .matches(options?.matches, t`User email does not match`),
    displayName: string().required(t`Display name cannot be empty`),
    password: string()
      .required(t`Password cannot be empty`)
      .min(12, t`Password must be at least 12 characters long`),
    passwordSignIn: string().required(t`Password cannot be empty`),
    confirmPassword: string()
      .required(t`Password confirmation cannot be empty`)
      .oneOf([ref('password')], t`Passwords must match`),
    currentPassword: string().required(t`Please enter your current password.`),
    lang: string()
      .required(t`Please choose your preferred language`)
      .oneOf(['ENGLISH', 'FRENCH'], ''),
    twoFactorCode: string()
      .required(t`Code field must not be empty`)
      .matches(/^\d+$/, t`Verification code must only contains numbers`)
      .length(6, t`Verification code must be exactly 6 digits long`),
    domainUrl: string().required(t`Domain url field must not be empty`),
    phoneNumber: string()
      .required(t`Phone number field must not be empty`)
      .matches(/^[1-9]\d{9,14}$/, t`Phone number must be a valid phone number that is 10-15 digits long`),
    acronym: string()
      .matches(/^[A-Z]+(?:_[A-Za-z]+)*$/gm, t`Acronyms can only use upper case letters and underscores`)
      .max(50, t`Acronyms must be at most 50 characters`),
    field: string().required(nonEmptyMessage()),
    filterCategory: string()
      .required(nonEmptyMessage())
      .oneOf(
        [
          'HTTPS_STATUS',
          'HSTS_STATUS',
          'CIPHERS_STATUS',
          'CURVES_STATUS',
          'PROTOCOLS_STATUS',
          'SPF_STATUS',
          'DKIM_STATUS',
          'DMARC_STATUS',
          'TAGS',
        ],
        '',
      ),
    comparison: string().required(nonEmptyMessage()).oneOf(['EQUAL', 'NOT_EQUAL'], ''),
    filterValue: string()
      .required(nonEmptyMessage())
      .oneOf(
        [
          'PASS',
          'INFO',
          'FAIL',
          'NEW',
          'PROD',
          'STAGING',
          'TEST',
          'WEB',
          'INACTIVE',
          'ARCHIVED',
          'NOUVEAU',
          'INACTIF',
          'DEV',
        ],
        '',
      ),
    selectors: array().of(
      string()
        .required(t`Selector cannot be empty`)
        .matches(
          /^(?:[a-zA-Z0-9](\.?[a-zA-Z0-9])*|\*)$/gm,
          t`Selector must be either a string containing alphanumeric characters and periods, starting and ending with only alphanumeric characters, or an asterisk`,
        ),
    ),
    statusOption: string().when('filterCategory', {
      is: (val) => val === 'STATUS',
      then: (schema) => schema.required(nonEmptyMessage()),
      otherwise: (schema) => schema.notRequired(),
    }),
  }
}

const filterSchema = (keyArray, options) => {
  const schema = getSchema(options)

  return keyArray.reduce((selectedSchema, currentKey) => {
    selectedSchema[currentKey] = schema[currentKey]
    return selectedSchema
  }, {})
}

export const getRequirement = (key, options) => {
  return getSchema(options)[key]
}

export const schemaToValidation = (schema) => {
  return object().shape(schema)
}

export const createValidationSchema = (keyArray, options) => {
  return schemaToValidation(filterSchema(keyArray, options))
}

getRequirement.propTypes = {
  keyArray: stringProp.isRequired,
}

schemaToValidation.propTypes = {
  schema: objectProp.isRequired,
}

createValidationSchema.propTypes = {
  keyArray: arrayProp.isRequired,
}
