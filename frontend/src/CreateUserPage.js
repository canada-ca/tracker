import React from 'react'
import { Button, Stack, useToast, Box, Heading, Text } from '@chakra-ui/core'
import { useMutation } from '@apollo/client'
import { object, string } from 'yup'
import { Link as RouteLink, useHistory, useParams } from 'react-router-dom'
import { Formik } from 'formik'
import { SIGN_UP } from './graphql/mutations'
import { useUserState } from './UserState'
import EmailField from './EmailField'
import PasswordConfirmation from './PasswordConfirmation'
import LanguageSelect from './LanguageSelect'
import { t, Trans } from '@lingui/macro'
import DisplayNameField from './DisplayNameField'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'
import { LoadingMessage } from './LoadingMessage'

export default function CreateUserPage() {
  const { login } = useUserState()
  const history = useHistory()
  const toast = useToast()
  const userOrgToken = useParams().userOrgToken || ''

  const validationSchema = object().shape({
    email: string()
      .required(fieldRequirements.email.required.message)
      .email(fieldRequirements.email.email.message),
    displayName: string().required(
      fieldRequirements.displayName.required.message,
    ),
    password: string()
      .required(fieldRequirements.password.required.message)
      .min(
        fieldRequirements.password.min.minLength,
        fieldRequirements.password.min.message,
      ),
    confirmPassword: string()
      .required(fieldRequirements.confirmPassword.required.message)
      .oneOf(
        fieldRequirements.confirmPassword.oneOf.types,
        fieldRequirements.confirmPassword.oneOf.message,
      ),
    lang: string()
      .required(fieldRequirements.lang.required.message)
      .oneOf(fieldRequirements.lang.oneOf.types),
  })

  const [signUp, { loading }] = useMutation(SIGN_UP, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to create your account, please try again.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted({ signUp }) {
      login({
        jwt: signUp.authResult.authToken,
        tfaSendMethod: signUp.authResult.user.tfaSendMethod,
        userName: signUp.authResult.user.userName,
      })
      // redirect to the home page.
      history.push('/')
      // Display a welcome message
      toast({
        title: t`Account created.`,
        description: t`Welcome, you are successfully signed in to your new account!`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (loading) return <LoadingMessage />

  const addUserToOrgText = userOrgToken ? (
    <Text fontSize="md">
      Your account will automatically be linked to the organization that invited
      you.
    </Text>
  ) : (
    ''
  )

  return (
    <Box px="8" mx="auto" overflow="hidden">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          email: '',
          displayName: '',
          password: '',
          confirmPassword: '',
          lang: '',
        }}
        onSubmit={async (values) => {
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
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>
                Create an account by entering an email and password.
              </Trans>
            </Heading>

            {addUserToOrgText}

            <EmailField name="email" width="100%" mb="4" />

            <DisplayNameField name="displayName" width="100%" mb="4" />

            <PasswordConfirmation spacing="4" width="100%" mb="4" />

            <LanguageSelect name="lang" width="100%" mb="4" />

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <TrackerButton
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
                variant="primary"
              >
                <Trans>Create Account</Trans>
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
