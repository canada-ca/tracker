import React from 'react'
import { t, Trans } from '@lingui/macro'
import PasswordField from './PasswordField'
import { object, string } from 'yup'
import { Box, Heading, Link, Text, useToast } from '@chakra-ui/core'
import { Link as RouteLink, useHistory, useLocation } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { SIGN_IN } from './graphql/mutations'
import EmailField from './EmailField'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'
import { LoadingMessage } from './LoadingMessage'
import { useUserVar } from './useUserVar'
import { useLingui } from '@lingui/react'
import { activate } from './i18n.config'

export default function SignInPage() {
  const { login } = useUserVar()
  const { i18n } = useLingui()
  const history = useHistory()
  const location = useLocation()
  const toast = useToast()

  const { from } = location.state || { from: { pathname: '/' } }

  const validationSchema = object().shape({
    password: string().required(
      i18n._(fieldRequirements.password.required.message),
    ),
    email: string()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

  const [signIn, { loading }] = useMutation(SIGN_IN, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to sign in to your account, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ signIn }) {
      // 2FA not enabled
      if (signIn.result.__typename === 'AuthResult') {
        login({
          jwt: signIn.result.authToken,
          tfaSendMethod: signIn.result.user.tfaSendMethod,
          userName: signIn.result.user.userName,
        })
        if (signIn.result.user.preferredLang === 'ENGLISH') activate('en')
        else if (signIn.result.user.preferredLang === 'FRENCH') activate('fr')
        // // redirect to the home page.
        history.push(from)
        // // Display a welcome message
        toast({
          title: i18n._(t`Sign In.`),
          description: i18n._(t`Welcome, you are successfully signed in!`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
      // 2FA enabled
      else if (signIn.result.__typename === 'TFASignInResult') {
        // redirect to the authenticate page
        history.push(
          `/authenticate/${signIn.result.sendMethod.toLowerCase()}/${
            signIn.result.authenticateToken
          }`,
          { from },
        )
      }
      // Non server side error occurs
      else if (signIn.result.__typename === 'SignInError') {
        toast({
          title: t`Unable to sign in to your account, please try again.`,
          description: signIn.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect signIn.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect signIn.result typename.')
      }
    },
  })

  if (loading) return <LoadingMessage />

  return (
    <Box px="4" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '' }}
        onSubmit={async (values) => {
          signIn({
            variables: { userName: values.email, password: values.password },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form
            onSubmit={handleSubmit}
            role="form"
            aria-label="form"
            name="form"
            autoComplete="on"
          >
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>Sign in with your username and password.</Trans>
            </Heading>

            <EmailField name="email" mb="4" />

            <PasswordField name="password" mb="1" />

            <Box width="fit-content">
              <Link as={RouteLink} to="/forgot-password" color="primary">
                <Text mb="4">
                  <Trans>Forgot your password?</Trans>
                </Text>
              </Link>
            </Box>

            <TrackerButton
              variant="primary"
              isLoading={isSubmitting}
              type="submit"
              width="100%"
              mb={5}
            >
              <Trans>Sign In</Trans>
            </TrackerButton>
          </form>
        )}
      </Formik>
    </Box>
  )
}
