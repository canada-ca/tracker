import React, { useState } from 'react'
import {
  Box,
  Button,
  Divider,
  Heading,
  Stack,
  Text,
  useToast,
  Checkbox,
  Link,
} from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { Link as RouteLink, useParams } from 'react-router-dom'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { ArrowForwardIcon, CheckCircleIcon } from '@chakra-ui/icons'

import { LanguageSelect } from './LanguageSelect'

import { EmailField } from '../components/fields/EmailField'
import { DisplayNameField } from '../components/fields/DisplayNameField'
import { PasswordConfirmation } from '../components/fields/PasswordConfirmation'
import { LoadingMessage } from '../components/LoadingMessage'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { useUserVar } from '../utilities/userState'
import { activate } from '../utilities/i18n.config'
import { SIGN_UP } from '../graphql/mutations'

export default function CreateUserPage() {
  const { login } = useUserVar()
  const toast = useToast()
  const userOrgToken = useParams().userOrgToken || ''
  const [showVerifyMessage, setShowVerifyMessage] = useState(false)

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
    <Box px="4" mx="auto" overflow="hidden" w="100%">
      <Formik
        validationSchema={createValidationSchema([
          'email',
          'displayName',
          'password',
          'confirmPassword',
          'lang',
        ])}
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
            <Heading
              as="h1"
              fontSize="3xl"
              mb="8"
              textAlign={{ lg: 'left', md: 'center' }}
            >
              <Trans>Register</Trans>
            </Heading>

            <Box mb="4">
              <Text fontWeight="bold" mb="2" fontSize="lg">
                <Trans>Welcome to Tracker, please enter your details.</Trans>
              </Text>
              <Text>
                <Trans>
                  Let's get you set up so you can verify your account
                  information and begin using Tracker.
                </Trans>
              </Text>
              {addUserToOrgText}
            </Box>

            <Stack
              direction={['column', 'row']}
              mb="4"
              w={{ lg: '50%', md: '100%' }}
            >
              <EmailField />
              <DisplayNameField />
            </Stack>

            <PasswordConfirmation
              direction={['column', 'row']}
              w={{ lg: '50%', md: '100%' }}
              mb="2"
            />

            <LanguageSelect name="lang" w={{ lg: '25%', md: '50%' }} mb="6" />

            <Box ml={{ lg: '12', md: '0' }} mb="4">
              <Checkbox
                colorScheme="orange"
                isRequired
                mb="4"
                borderColor="black"
              >
                I agree to all Terms, Privacy Policy & Code of Conduct
                Guidelines
              </Checkbox>

              <Box>
                <Button
                  variant="primary"
                  type="submit"
                  id="submitBtn"
                  isLoading={isSubmitting}
                  w={['100%', '25%']}
                  mb="4"
                >
                  <Trans>Create Account</Trans>
                </Button>
              </Box>
              <Text>
                Already have an account?{' '}
                <Link as={RouteLink} to="/sign-in">
                  Log in
                </Link>
              </Text>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  )
}
