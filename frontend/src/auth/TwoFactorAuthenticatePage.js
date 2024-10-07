import React from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Box, Button, Heading, Stack, Text, useToast } from '@chakra-ui/react'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { ErrorMessage, Formik } from 'formik'

import { LoadingMessage } from '../components/LoadingMessage'
import { AuthenticateField } from '../components/fields/AuthenticateField'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { AUTHENTICATE } from '../graphql/mutations'

export default function TwoFactorAuthenticatePage() {
  const { login } = useUserVar()
  const history = useHistory()
  const location = useLocation()
  const toast = useToast()
  const { i18n } = useLingui()
  const { sendMethod, authenticateToken } = useParams()
  const { from } = location.state || { from: { pathname: '/' } }

  const [authenticate, { loading, error }] = useMutation(AUTHENTICATE, {
    onError() {
      toast({
        title: i18n._(t`An error occurred.`),
        description: i18n._(t`Unable to sign in to your account, please try again.`),
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
      history.push('/sign-in')
    },
    onCompleted({ authenticate }) {
      // User successfully completes tfa validation
      if (authenticate.result.__typename === 'AuthResult') {
        login({
          jwt: authenticate.result.authToken,
          tfaSendMethod: authenticate.result.user.tfaSendMethod,
          userName: authenticate.result.user.userName,
          emailValidated: authenticate.result.user.emailValidated,
          insideUser: authenticate.result.user.insideUser,
          affiliations: authenticate.result.user.affiliations,
        })
        // redirect to the home page.
        history.replace(from)
        // Display a welcome message
        toast({
          title: i18n._(t`Sign In.`),
          description: i18n._(t`Welcome, you are successfully signed in!`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
      // Non server error occurs
      else if (authenticate.result.__typename === 'AuthenticateError') {
        toast({
          title: i18n._(t`Unable to sign in to your account, please try again.`),
          description: authenticate.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        history.push('/sign-in')
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect authenticate.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        history.push('/sign-in')
      }
    },
  })

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Box w="100%">
      <Formik
        validationSchema={createValidationSchema(['twoFactorCode'])}
        initialValues={{
          twoFactorCode: '',
          authenticateToken: authenticateToken,
        }}
        onSubmit={async (values) => {
          authenticate({
            variables: {
              sendMethod: sendMethod === 'email' ? 'EMAIL' : 'PHONE',
              authenticationCode: parseInt(values.twoFactorCode),
              authenticateToken: values.authenticateToken,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} role="form" aria-label="form" name="form">
            <Heading as="h1" fontSize="2xl" mb="12" textAlign="center">
              <Trans>Two Factor Authentication</Trans>
            </Heading>

            <Stack align="center">
              <AuthenticateField sendMethod={sendMethod} />
              <Text color="red">
                <ErrorMessage name="twoFactorCode" />
              </Text>
              <Button variant="primary" isLoading={isSubmitting} type="submit">
                <Trans>Submit</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
