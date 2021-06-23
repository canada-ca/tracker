import React from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number, object } from 'yup'
import { Box, Heading, Stack, useToast } from '@chakra-ui/core'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { useUserVar } from './useUserVar'
import { AUTHENTICATE } from './graphql/mutations'
import AuthenticateField from './AuthenticateField'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'
import { activate } from './i18n.config'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

export default function TwoFactorAuthenticatePage() {
  const { login } = useUserVar()
  const history = useHistory()
  const location = useLocation()
  const toast = useToast()
  const { i18n } = useLingui()
  const { sendMethod, authenticateToken } = useParams()
  const { from } = location.state || { from: { pathname: '/' } }

  const validationSchema = object().shape({
    twoFactorCode: number()
      .typeError(i18n._(fieldRequirements.twoFactorCode.typeError))
      .required(i18n._(fieldRequirements.twoFactorCode.required)),
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
        position: 'top-left',
      })
    },
    onCompleted({ authenticate }) {
      // User successfully completes tfa validation
      if (authenticate.result.__typename === 'AuthResult') {
        login({
          jwt: authenticate.result.authToken,
          tfaSendMethod: authenticate.result.user.tfaSendMethod,
          userName: authenticate.result.user.userName,
        })
        if (authenticate.result.user.preferredLang === 'ENGLISH') activate('en')
        else if (authenticate.result.user.preferredLang === 'FRENCH')
          activate('fr')
        // // redirect to the home page.
        history.replace(from)
        // // Display a welcome message
        toast({
          title: i18n._(t`Sign In.`),
          description: i18n._(t`Welcome, you are successfully signed in!`),
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      }
      // Non server error occurs
      else if (authenticate.result.__typename === 'AuthenticateError') {
        toast({
          title: i18n._(
            t`Unable to sign in to your account, please try again.`,
          ),
          description: authenticate.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect authenticate.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect authenticate.result typename.')
      }
    },
  })

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Box w="100%">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          twoFactorCode: '',
          authenticateToken: authenticateToken,
        }}
        onSubmit={async (values) => {
          authenticate({
            variables: {
              authenticationCode: parseInt(values.twoFactorCode),
              authenticateToken: values.authenticateToken,
            },
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
            <Heading as="h1" fontSize="2xl" mb="12" textAlign="center">
              <Trans>Two Factor Authentication</Trans>
            </Heading>

            <AuthenticateField
              name="twoFactorCode"
              mb="4"
              sendMethod={sendMethod}
            />

            <Stack align="center">
              <TrackerButton
                variant="primary"
                isLoading={isSubmitting}
                type="submit"
              >
                <Trans>Submit</Trans>
              </TrackerButton>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
