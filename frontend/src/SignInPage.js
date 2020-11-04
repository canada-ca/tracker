import React from 'react'
import { Trans, t } from '@lingui/macro'
import PasswordField from './PasswordField'
import { object, string } from 'yup'
import {
  Text,
  Stack,
  Button,
  Link,
  useToast,
  Box,
  Heading,
} from '@chakra-ui/core'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { useUserState } from './UserState'
import { AUTHENTICATE } from './graphql/mutations'
import EmailField from './EmailField'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'
import { LoadingMessage } from './LoadingMessage'

export default function SignInPage() {
  const { login } = useUserState()
  const history = useHistory()
  const toast = useToast()

  const validationSchema = object().shape({
    password: string().required(
      fieldRequirements.password.required.message,
    ),
    email: string()
      .required(fieldRequirements.email.required.message)
      .email(fieldRequirements.email.email.message),
  })

  const [authenticate, { loading }] = useMutation(AUTHENTICATE, {
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
    onCompleted({ authenticate }) {
      login({
        jwt: authenticate.authResult.authToken,
        tfa: authenticate.authResult.user.tfa,
        userName: authenticate.authResult.user.userName,
      })
      // redirect to the home page.
      history.push('/')
      // Display a welcome message
      toast({
        title: t`Sign In.`,
        description: t`Welcome, you are successfully signed in!`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) return <LoadingMessage />

  return (
    <Box px="8" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '' }}
        onSubmit={async (values) => {
          authenticate({
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

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <TrackerButton
                variant="primary"
                isLoading={isSubmitting}
                type="submit"
              >
                <Trans>Sign In</Trans>
              </TrackerButton>

              <Button
                as={RouteLink}
                to="/create-user"
                color="primary"
                bg="transparent"
                borderColor="primary"
                borderWidth="1px"
              >
                <Trans>Create Account</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
