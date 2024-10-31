import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Heading, Stack, Text, useToast } from '@chakra-ui/react'
import { object, string } from 'yup'
import { Formik } from 'formik'
import { Link as RouteLink, useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import { EmailField } from '../components/fields/EmailField'
import { LoadingMessage } from '../components/LoadingMessage'
import { SEND_PASSWORD_RESET_LINK } from '../graphql/mutations'

export default function ForgotPasswordPage() {
  const toast = useToast()
  const navigate = useNavigate()
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
        navigate('/')
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
    <Box px="4" mx="auto" overflow="hidden" w="100%">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '' }}
        onSubmit={async (values, { setSubmitting }) => {
          await sendPasswordResetLink({
            variables: { userName: values.email },
          })
          setSubmitting(false) // Optional if you want to reset form state
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form
            onSubmit={handleSubmit}
            role="form"
            aria-label="form"
            name="form"
          >
            <Heading
              as="h1"
              fontSize="3xl"
              mb="8"
              textAlign={{ lg: 'left', md: 'center' }}
            >
              <Trans>Forgot Password</Trans>
            </Heading>

            <Box mb="8">
              <Text fontSize="lg" mb="2">
                <Trans>
                  Enter your user account's verified email address and we will
                  send you a password reset link.
                </Trans>
              </Text>
            </Box>

            <Box w={{ md: '100%', lg: '33%' }}>
              <EmailField name="email" mb="4" />
              <Stack spacing={4} isInline justifyContent="space-between">
                <Button
                  variant="primary"
                  aria-label="forgot-password-submit"
                  type="submit"
                  id="submitBtn"
                  isLoading={isSubmitting}
                  isDisabled={isSubmitting}
                >
                  <Trans>Submit</Trans>
                </Button>

                <Button as={RouteLink} to="/sign-in" variant="primaryOutline">
                  <Trans>Back</Trans>
                </Button>
              </Stack>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  )
}
