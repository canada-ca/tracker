import { ref, string } from 'yup'
import { t } from '@lingui/macro'

export const fieldRequirements = {
  email: string()
    .required(t`Email cannot be empty`)
    .email(t`Invalid email`),
  displayName: string().required(t`Display name cannot be empty`),
  password: string()
    .required(t`Password cannot be empty`)
    .min(12, t`Password must be at least 12 characters long`),
  confirmPassword: string()
    .required(t`Password confirmation cannot be empty`)
    .oneOf([ref('password')], t`Passwords must match`),
  lang: string()
    .oneOf(['ENGLISH', 'FRENCH'])
    .required(t`Please choose your preferred language`),
}
