import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Stack, Button, Box, useToast, Heading } from '@chakra-ui/core'
import EmailField from './EmailField'
import { object, string } from 'yup'
import { Formik } from 'formik'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { SEND_PASSWORD_RESET_LINK } from './graphql/mutations'
import { TrackerButton } from './TrackerButton'

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
      onError(error) {
        toast({
          title: error.message,
          description: i18n._(t`Unable to send password reset link to email.`),
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'bottom-left',
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
          position: 'bottom-left',
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
    <Box px="8" mx="auto" overflow="hidden" w={['100%', '60%']}>
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '' }}
        onSubmit={async values => {
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

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <TrackerButton
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
                variant="primary"
              >
                <Trans>Submit</Trans>
              </TrackerButton>

              <Button
                as={RouteLink}
                to="/sign-in"
                color="primary"
                bg="transparent"
                borderColor="primary"
                borderWidth="1px"
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
