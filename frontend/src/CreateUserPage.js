import React from 'react'
import { Button, Stack, Text, useToast } from '@chakra-ui/core'
import { useMutation } from '@apollo/react-hooks'
import { object, string } from 'yup'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import { SIGN_UP } from './graphql/mutations'
import { useUserState } from './UserState'
import { EmailField } from './EmailField'
import { PasswordConfirmation } from './PasswordConfirmation'
import { LanguageSelect } from './LanguageSelect'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export default function CreateUserPage() {
  const { login } = useUserState()
  const history = useHistory()
  const toast = useToast()
  const { i18n } = useLingui()

  const validationSchema = object().shape({
    email: string().required('cannot be empty'),
    password: string().required('cannot be empty'),
    confirmPassword: string().required('cannot be empty'),
  })

  const [signUp, { loading, error }] = useMutation(SIGN_UP, {
    onError() {
      console.log(error)
      toast({
        title: i18n._(t`An error occurred.`),
        description: i18n._(
          t`Unable to create your account, please try again.`,
        ),
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    },
    onCompleted({ signUp }) {
      login({
        jwt: signUp.authResult.authToken,
        tfa: signUp.authResult.user.tfa,
        userName: signUp.authResult.user.userName,
      })
      // redirect to the home page.
      history.push('/')
      // Display a welcome message
      toast({
        title: i18n._(t`Account created.`),
        description: i18n._(
          t`Welcome, you are successfully signed in to your new account!`,
        ),
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
    <Stack spacing={2} mx="auto">
      <Text mb={4} fontSize="2xl">
        <Trans>Create an account by entering an email and password.</Trans>
      </Text>
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        onSubmit={async (values) => {
          signUp({
            variables: {
              userName: values.email,
              password: values.password,
              confirmPassword: values.confirmPassword,
              displayName: values.email,
              preferredLang: values.lang,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <EmailField name="email" />

            <PasswordConfirmation />

            <LanguageSelect name="lang" />

            <Stack mt={6} spacing={4} isInline>
              <Button
                variantColor="teal"
                isLoading={isSubmitting}
                type="submit"
                id="submitBtn"
              >
                {i18n._(t`Create Account`)}
              </Button>

              <Button
                as={RouteLink}
                to="/sign-in"
                variantColor="teal"
                variant="outline"
              >
                {i18n._(t`Back`)}
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}
