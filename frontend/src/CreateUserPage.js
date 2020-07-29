import React from 'react'
import { Button, Stack, useToast, Box, Heading, Text } from '@chakra-ui/core'
import { useMutation } from '@apollo/client'
import { object } from 'yup'
import { Link as RouteLink, useHistory, useParams } from 'react-router-dom'
import { Formik } from 'formik'
import { SIGN_UP } from './graphql/mutations'
import { useUserState } from './UserState'
import EmailField from './EmailField'
import PasswordConfirmation from './PasswordConfirmation'
import LanguageSelect from './LanguageSelect'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import DisplayNameField from './DisplayNameField'
import { fieldRequirements } from './fieldRequirements'

export default function CreateUserPage() {
  const { login } = useUserState()
  const history = useHistory()
  const toast = useToast()
  const { i18n } = useLingui()
  const { userOrgToken } = useParams()

  const validationSchema = object().shape({
    email: fieldRequirements.email,
    displayName: fieldRequirements.displayName,
    password: fieldRequirements.password,
    confirmPassword: fieldRequirements.confirmPassword,
    lang: fieldRequirements.lang,
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

  const addUserToOrgText =
    userOrgToken !== undefined ? (
      <Text fontSize="md">
        Your account will automatically be linked to the organization that
        invited you.
      </Text>
    ) : (
      ''
    )

  return (
    <Box mx="auto">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          email: '',
          displayName: '',
          password: '',
          confirmPassword: '',
          lang: '',
        }}
        onSubmit={async values => {
          signUp({
            variables: {
              userName: values.email,
              displayName: values.displayName,
              password: values.password,
              confirmPassword: values.confirmPassword,
              preferredLang: values.lang,
              signUpToken: userOrgToken,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Stack spacing="6" align="center">
              <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
                <Trans>
                  Create an account by entering an email and password.
                </Trans>
              </Heading>

              {addUserToOrgText}

              <EmailField name="email" width="100%" />

              <DisplayNameField name="displayName" width="100%" />

              <PasswordConfirmation mb="4" width="100%" spacing="6" />

              <LanguageSelect name="lang" width="100%" />

              <Stack spacing={4} isInline mr="auto">
                <Button
                  variantColor="teal"
                  isLoading={isSubmitting}
                  type="submit"
                  id="submitBtn"
                >
                  <Trans>Create Account</Trans>
                </Button>

                <Button
                  as={RouteLink}
                  to="/sign-in"
                  variantColor="teal"
                  variant="outline"
                >
                  <Trans>Back</Trans>
                </Button>
              </Stack>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
