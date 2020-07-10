import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, Button, Box } from '@chakra-ui/core'
import PasswordConfirmation from './PasswordConfirmation'
import { object, string, ref } from 'yup'
import { Formik } from 'formik'
import { useHistory } from 'react-router-dom'

export default function ChangePasswordPage() {
  const { i18n } = useLingui()
  const history = useHistory()

  const validationSchema = object().shape({
    password: string()
      .required(i18n._(t`Password cannot be empty`))
      .min(12, i18n._(t`Password must be at least 12 characters long`)),
    confirmPassword: string()
      .required(i18n._(t`Password confirmation cannot be empty`))
      .oneOf([ref('password')], i18n._(t`Passwords must match`)),
  })

  return (
    <Box mx="auto">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values) => {
          window.alert(`change password to ${values.password}`)
          history.push('/sign-in')
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form
            onSubmit={handleSubmit}
            role="form"
            aria-label="form"
            name="form"
          >
            <Stack align="center">
              <Text fontSize="2xl" mb="4">
                <Trans>Enter and confirm your new password.</Trans>
              </Text>
            </Stack>

            <PasswordConfirmation mb="4" spacing="4" />

            <Stack spacing={4} isInline>
              <Button
                variantColor="teal"
                type="submit"
                isLoading={isSubmitting}
                id="submitBtn"
              >
                <Trans>Change Password</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
