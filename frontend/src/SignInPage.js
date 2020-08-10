import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
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
import { SIGN_IN } from './graphql/mutations'
import EmailField from './EmailField'
import { fieldRequirements } from './fieldRequirements'

export default function SignInPage() {
  const history = useHistory()
  const toast = useToast()
  const { i18n } = useLingui()

  const validationSchema = object().shape({
    password: string().required(
      i18n._(fieldRequirements.password.required.message),
    ),
    email: string()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
  })

  const [signIn, { loading, error }] = useMutation(SIGN_IN, {
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
    onCompleted({ signIn }) {
      // redirect to the authenticate page
      history.push(`/authenticate/${signIn.authenticateToken}`)
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
    <Box px="2em" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '' }}
        onSubmit={async values => {
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
            <Heading as="h1" fontSize="2xl" mb="12">
              <Trans>Sign in with your username and password.</Trans>
            </Heading>

            <EmailField name="email" mb="4" />

            <PasswordField name="password" mb="1" />

            <Link as={RouteLink} to="/forgot-password" color="teal.500">
              <Text mb="4">
                <Trans>Forgot your password?</Trans>
              </Text>
            </Link>

            <Stack spacing={4} isInline>
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
    </Box>
  )
}
