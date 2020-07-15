import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, Button, Box, useToast } from '@chakra-ui/core'
import EmailField from './EmailField'
import { object, string } from 'yup'
import { Formik } from 'formik'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/react-hooks'
import { SEND_PASSWORD_RESET_LINK } from './graphql/mutations'

export default function ForgotPasswordPage() {
  const { i18n } = useLingui()
  const toast = useToast()
  const history = useHistory()
  const validationSchema = object().shape({
    email: string()
      .required(i18n._(t`Email cannot be empty`))
      .email(i18n._(t`Invalid email`)),
  })

  const [sendPasswordResetLink, { loading, error }] = useMutation(
    SEND_PASSWORD_RESET_LINK,
    {
      onError() {
        toast({
          title: i18n._(t`An error occurred.`),
          description: i18n._(t`Unable to send password reset link to email.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        history.push('/')
        // Display a welcome message
        toast({
          title: i18n._(t`Email Sent`),
          description: i18n._(
            t`An email was sent with a link to reset your password`,
          ),
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  if (error) return <p>{String(error)}</p>

  return (
    <Box mx="auto">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '' }}
        onSubmit={async (values) => {
          sendPasswordResetLink({
            variables: { userName: values.email },
          })
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
