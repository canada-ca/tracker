import React from 'react'
import { Box, Button, Heading, Stack, Text, useToast } from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { object, string } from 'yup'
import { Link as RouteLink, useHistory, useParams } from 'react-router-dom'
import { Formik } from 'formik'
import { SIGN_UP } from './graphql/mutations'
import { useUserVar } from './UserState'
import EmailField from './EmailField'
import PasswordConfirmation from './PasswordConfirmation'
import LanguageSelect from './LanguageSelect'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import DisplayNameField from './DisplayNameField'
import { fieldRequirements } from './fieldRequirements'
import { LoadingMessage } from './LoadingMessage'
import { activate } from './i18n.config'
import { TermsConditionsPage } from './TermsConditionsPage'

export default function CreateUserPage() {
  const { login } = useUserVar()
  const history = useHistory()
  const toast = useToast()
  const userOrgToken = useParams().userOrgToken || ''

  const validationSchema = object().shape({
    email: string()
      .required(i18n._(fieldRequirements.email.required.message))
      .email(i18n._(fieldRequirements.email.email.message)),
    displayName: string().required(
      i18n._(fieldRequirements.displayName.required.message),
    ),
    password: string()
      .required(i18n._(fieldRequirements.password.required.message))
      .min(
        fieldRequirements.password.min.minLength,
        i18n._(fieldRequirements.password.min.message),
      ),
    confirmPassword: string()
      .required(i18n._(fieldRequirements.confirmPassword.required.message))
      .oneOf(
        fieldRequirements.confirmPassword.oneOf.types,
        i18n._(fieldRequirements.confirmPassword.oneOf.message),
      ),
    lang: string()
      .required(i18n._(fieldRequirements.lang.required.message))
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
      if (signUp.result.__typename === 'AuthResult') {
        login({
          jwt: signUp.result.authToken,
          tfaSendMethod: signUp.result.user.tfaSendMethod,
          userName: signUp.result.user.userName,
        })
        if (signUp.result.user.preferredLang === 'ENGLISH') activate('en')
        else if (signUp.result.user.preferredLang === 'FRENCH') activate('fr')
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
      } else if (signUp.result.__typename === 'SignUpError') {
        toast({
          title: t`Unable to create account, please try again.`,
          description: signUp.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect signUp.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect signUp.result typename.')
      }
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
    <Box px="4" mx="auto" overflow="hidden">
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

            <Box
              overflow="scroll"
              height="20em"
              border="1px"
              borderColor="gray.200"
              p={4}
              m={4}
            >
              <TermsConditionsPage />
            </Box>

            <Stack spacing={4} isInline justifyContent="space-between" mb="4">
              <Button variant="primaryOutline" as={RouteLink} to="/sign-in">
                <Trans>Back</Trans>
              </Button>

              <Button
                variant="primary"
                type="submit"
                id="submitBtn"
                isLoading={isSubmitting}
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
