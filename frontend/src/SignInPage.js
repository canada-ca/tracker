import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PasswordField } from './PasswordField'
import { object, string } from 'yup'
import { Text, Stack, Button, Link, useToast } from '@chakra-ui/core'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/react-hooks'
import { Formik } from 'formik'
import { useUserState } from './UserState'
import { AUTHENTICATE } from './graphql/mutations'
import { EmailField } from './EmailField'

export default function SignInPage() {
  const { login } = useUserState()
  const history = useHistory()
  const toast = useToast()
  const { i18n } = useLingui()

  const validationSchema = object().shape({
    password: string().required(i18n._(t`Password cannot be empty`)),
    email: string().required(i18n._(t`Email cannot be empty`)),
  })

  const [authenticate, { loading, error }] = useMutation(AUTHENTICATE, {
    onError() {
      toast({
        title: i18n._(t`An error occurred.`),
        description: i18n._(
          t`Unable to sign in to your account, please try again.`,
        ),
        status: 'error',
        duration: 9000,
        isClosable: true,
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
        title: i18n._(t`Sign In.`),
        description: i18n._(t`Welcome, you are successfully signed in!`),
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  if (error) return <p>{String(error)}</p>

  return (
    <Stack spacing={4} mx="auto">
      <Text fontSize="2xl">
        <Trans>Sign in with your username and password.</Trans>
      </Text>

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
            <EmailField name="email" />

            <PasswordField name="password" />

            <Link as={RouteLink} to="/forgot-password">
              <Trans>Forgot your password?</Trans>
            </Link>

            <Stack mt={6} spacing={4} isInline>
              <Button
                variantColor="teal"
                isLoading={isSubmitting}
                type="submit"
              >
                <Trans>Sign In</Trans>
              </Button>

              <Button
                as={RouteLink}
                to="/create-user"
                variantColor="teal"
                variant="outline"
              >
                <Trans>Create Account</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}
