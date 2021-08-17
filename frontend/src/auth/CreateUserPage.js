import React, { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Heading,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { object, string } from 'yup'
import { Link as RouteLink, useParams } from 'react-router-dom'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { i18n } from '@lingui/core'
import { ArrowForwardIcon, CheckCircleIcon } from '@chakra-ui/icons'

import { LanguageSelect } from './LanguageSelect'

import { EmailField } from '../components/EmailField'
import { DisplayNameField } from '../components/DisplayNameField'
import { PasswordConfirmation } from '../components/PasswordConfirmation'
import { LoadingMessage } from '../components/LoadingMessage'
import { fieldRequirements } from '../utilities/fieldRequirements'
import { useUserVar } from '../utilities/userState'
import { activate } from '../utilities/i18n.config'
import TermsConditionsPage from '../termsConditions/TermsConditionsPage'
import { SIGN_UP } from '../graphql/mutations'

export default function CreateUserPage() {
  const { login } = useUserVar()
  const toast = useToast()
  const userOrgToken = useParams().userOrgToken || ''
  const [showVerifyMessage, setShowVerifyMessage] = useState(false)

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
          emailValidated: signUp.result.user.emailValidated,
        })
        if (signUp.result.user.preferredLang === 'ENGLISH') activate('en')
        else if (signUp.result.user.preferredLang === 'FRENCH') activate('fr')
        setShowVerifyMessage(true)
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

  if (showVerifyMessage)
    return (
      <Stack px="8" mx="auto" overflow="hidden" align="center">
        <Stack isInline align="center">
          <CheckCircleIcon color="strong" />
          <Text fontWeight="bold" fontSize="2xl" textAlign="center">
            <Trans>
              A verification link has been sent to your email account
            </Trans>
          </Text>
        </Stack>
        <Divider />
        <Text fontSize="lg">
          <Trans>
            Please follow the link in order to verify your account and start
            using Tracker.
          </Trans>
        </Text>
        <Divider />
        <Button
          as={RouteLink}
          to="/"
          color="primary"
          bg="transparent"
          borderColor="primary"
          borderWidth="1px"
          rightIcon={<ArrowForwardIcon />}
        >
          <Trans>Continue</Trans>
        </Button>
      </Stack>
    )

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

            <EmailField formProps={{ w: '100%', mb: '4' }} />

            <DisplayNameField formProps={{ w: '100%', mb: '4' }} />

            <PasswordConfirmation formProps={{ w: '100%', mb: '4' }} />

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

            <Stack spacing={4} isInline justifyContent="space-between">
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
