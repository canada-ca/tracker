import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, Button, Box } from '@chakra-ui/core'
import EmailField from './EmailField'
import { object, string } from 'yup'
import { Formik } from 'formik'
import { Link as RouteLink } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const { i18n } = useLingui()

  const validationSchema = object().shape({
    email: string()
      .required(i18n._(t`Email cannot be empty`))
      .email(i18n._(t`Invalid email`)),
  })

  return (
    <Box mx="auto">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          window.alert(`validation email sent to ${values.email}`)
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
              <Text fontSize="xl" mb="4">
                <Trans>Enter your user account's verified email address</Trans>
              </Text>
              <Text fontSize="xl" mb="4">
                <Trans>and we will send you a password reset link.</Trans>
              </Text>
            </Stack>

            <EmailField name="email" mb="4" />

            <Stack spacing={4} isInline>
              <Button
                variantColor="teal"
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
                as={RouteLink}
                to="/change-password"
              >
                <Trans>Submit</Trans>
              </Button>

              <Button
                as={RouteLink}
                to="/sign-in"
                variantColor="teal"
                variant="outline"
              >
                <Trans>Back</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
