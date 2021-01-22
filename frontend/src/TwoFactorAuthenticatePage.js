import React from 'react'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number, object } from 'yup'
import { Box, Heading, useToast, Stack } from '@chakra-ui/core'
import { useHistory, useParams, useLocation } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { Formik } from 'formik'
import { useUserState } from './UserState'
import { AUTHENTICATE } from './graphql/mutations'
import AuthenticateField from './AuthenticateField'
import { fieldRequirements } from './fieldRequirements'
import { TrackerButton } from './TrackerButton'

export default function TwoFactorAuthenticatePage() {
  const { login } = useUserState()
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
      })
    },
    onCompleted({ authenticate }) {
      login({
        jwt: authenticate.authResult.authToken,
        tfaSendMethod: authenticate.authResult.user.tfaSendMethod,
        userName: authenticate.authResult.user.userName,
      })
      // // redirect to the home page.
      history.replace(from)
      // // Display a welcome message
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
