import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Checkbox, Flex, Heading, Link, Text, useToast } from '@chakra-ui/react'
import { Link as RouteLink, useHistory, useLocation } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { useLingui } from '@lingui/react'

import { EmailField } from '../components/fields/EmailField'
import { PasswordField } from '../components/fields/PasswordField'
import { LoadingMessage } from '../components/LoadingMessage'
import { useUserVar } from '../utilities/userState'
import { getRequirement, schemaToValidation } from '../utilities/fieldRequirements'
import { SIGN_IN } from '../graphql/mutations'

export default function SignInPage() {
  const { login } = useUserVar()
  const { i18n } = useLingui()
  const history = useHistory()
  const location = useLocation()
  const toast = useToast()

  const { from } = location.state || { from: { pathname: '/' } }

  const validationSchema = schemaToValidation({
    email: getRequirement('email'),
    password: getRequirement('passwordSignIn'),
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
          emailValidated: signIn.result.user.emailValidated,
          insideUser: signIn.result.user.insideUser,
          affiliations: signIn.result.user.affiliations,
        })
        // redirect to the home page.
        history.push(from)
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
      // 2FA enabled
      else if (signIn.result.__typename === 'TFASignInResult') {
        // redirect to the authenticate page
        history.push(`/authenticate/${signIn.result.sendMethod.toLowerCase()}/${signIn.result.authenticateToken}`, {
          from,
        })
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
    <Box px="4" mx="auto" overflow="hidden" w="100%">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '', rememberMe: false }}
        onSubmit={async (values) => {
          signIn({
            variables: {
              userName: values.email,
              password: values.password,
              rememberMe: values.rememberMe,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting, handleChange }) => (
          <form onSubmit={handleSubmit} role="form" aria-label="form" name="form" autoComplete="on">
            <Heading as="h1" fontSize="3xl" mb="8" textAlign={{ lg: 'left', md: 'center' }}>
              <Trans>Login</Trans>
            </Heading>

            <Box mb="8">
              <Text fontSize="lg" fontWeight="bold" mb="2">
                <Trans>Login to your account</Trans>
              </Text>
            </Box>

            <Box w={{ md: '100%', lg: '33%' }}>
              <EmailField inputProps={{ autoFocus: true }} name="email" mb={4} />

              <PasswordField name="password" mb={2} />

              <Flex mb="4">
                <Checkbox name="rememberMe" colorScheme="orange" borderColor="black" size="lg" onChange={handleChange}>
                  <Text fontSize="md">
                    <Trans>Remember me</Trans>
                  </Text>
                </Checkbox>

                <Link as={RouteLink} to="/forgot-password" color="primary" ml="auto">
                  <Text>
                    <Trans>Forgot your password?</Trans>
                  </Text>
                </Link>
              </Flex>

              <Button variant="primary" isLoading={isSubmitting} type="submit" width="100%" mb={5}>
                <Trans>Sign In</Trans>
              </Button>

              <Text textAlign="center">
                <Trans>
                  Don't have an account?{' '}
                  <Link as={RouteLink} to="/create-user">
                    Sign up
                  </Link>
                </Trans>
              </Text>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  )
}
