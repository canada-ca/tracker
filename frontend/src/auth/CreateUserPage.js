import React from 'react'
import { Box, Button, Heading, Stack, Text, useToast, Checkbox, Link } from '@chakra-ui/react'
import { useMutation } from '@apollo/client'
import { Link as RouteLink, useParams, useHistory, useLocation } from 'react-router-dom'
import { Formik } from 'formik'
import { t, Trans } from '@lingui/macro'
import { ExternalLinkIcon } from '@chakra-ui/icons'

import { EmailField } from '../components/fields/EmailField'
import { DisplayNameField } from '../components/fields/DisplayNameField'
import { PasswordConfirmation } from '../components/fields/PasswordConfirmation'
import { LoadingMessage } from '../components/LoadingMessage'
import { createValidationSchema } from '../utilities/fieldRequirements'
import { SIGN_UP } from '../graphql/mutations'

export default function CreateUserPage() {
  const toast = useToast()
  const history = useHistory()
  const location = useLocation()
  const userOrgToken = useParams().userOrgToken || ''

  const { from } = location.state || { from: { pathname: '/' } }

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
      if (signUp.result.__typename === 'TFASignInResult') {
        // redirect to the authenticate page
        history.push(`/authenticate/${signUp.result.sendMethod.toLowerCase()}/${signUp.result.authenticateToken}`, {
          from,
        })
        // Display a welcome message
        toast({
          title: t`Account created.`,
          description: t`Please enter your one-time code to continue to Tracker.`,
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
      <Trans>Your account will automatically be linked to the organization that invited you.</Trans>
    </Text>
  ) : (
    ''
  )

  return (
    <Box px="4" mx="auto" overflow="hidden" w="100%">
      <Formik
        validationSchema={createValidationSchema(['email', 'displayName', 'password', 'confirmPassword'])}
        initialValues={{
          email: '',
          displayName: '',
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values) => {
          signUp({
            variables: {
              userName: values.email,
              displayName: values.displayName,
              password: values.password,
              confirmPassword: values.confirmPassword,
              signUpToken: userOrgToken,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <Heading as="h1" fontSize="3xl" mb="8" textAlign={{ lg: 'left', md: 'center' }}>
              <Trans>Register</Trans>
            </Heading>

            <Box mb="4">
              <Text fontWeight="bold" mb="2" fontSize="lg">
                <Trans>Welcome to Tracker, please enter your details.</Trans>
              </Text>
              <Text>
                <Trans>Let's get you set up so you can verify your account information and begin using Tracker.</Trans>
              </Text>
              {addUserToOrgText}
            </Box>

            <Stack direction={['column', 'row']} mb="4" w={{ lg: '50%', md: '100%' }}>
              <EmailField />
              <DisplayNameField />
            </Stack>

            <PasswordConfirmation direction={['column', 'row']} w={{ lg: '50%', md: '100%' }} mb="2" />

            <Box mb="4">
              <Checkbox colorScheme="orange" isRequired mb="4" borderColor="black">
                <Trans>
                  I agree to all{' '}
                  <Link color="blue.600" as={RouteLink} isExternal to="/terms-and-conditions">
                    Terms, Privacy Policy & Code of Conduct Guidelines <ExternalLinkIcon />
                  </Link>
                </Trans>
              </Checkbox>

              <Box>
                <Text fontWeight="bold" mb="2">
                  <Trans>Multifactor authentication (MFA) is active by default and used to verify account email</Trans>
                </Text>
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
                <Trans>
                  Already have an account?{' '}
                  <Link as={RouteLink} to="/sign-in">
                    Log in
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
