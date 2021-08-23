import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Heading, Stack, useToast } from '@chakra-ui/react'
import { object, string } from 'yup'
import { Formik } from 'formik'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import { EmailField } from '../components/fields/EmailField'
import { LoadingMessage } from '../components/LoadingMessage'
import { SEND_PASSWORD_RESET_LINK } from '../graphql/mutations'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const history = useHistory()
  const validationSchema = object().shape({
    email: string()
      .required(t`Email cannot be empty`)
      .email(t`Invalid email`),
  })

  const [sendPasswordResetLink, { loading }] = useMutation(
    SEND_PASSWORD_RESET_LINK,
    {
      onError(error) {
        toast({
          title: error.message,
          description: t`Unable to send password reset link to email.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
      onCompleted() {
        history.push('/')
        toast({
          title: t`Email Sent`,
          description: t`An email was sent with a link to reset your password`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
    },
  )

  if (loading) return <LoadingMessage />

  return (
    <Box px="4" mx="auto" overflow="hidden" w={{ base: '100%', md: '60%' }}>
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
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>
                Enter your user account's verified email address and we will
                send you a password reset link.
              </Trans>
            </Heading>

            <EmailField name="email" mb="4" />

            <Stack spacing={4} isInline justifyContent="space-between">
              <Button
                variant="primary"
                aria-label="forgot-password-submit"
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
              >
                <Trans>Submit</Trans>
              </Button>

              <Button as={RouteLink} to="/sign-in" variant="primaryOutline">
                <Trans>Back</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
