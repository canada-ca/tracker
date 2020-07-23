import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, Button, Box, useToast } from '@chakra-ui/core'
import PasswordConfirmation from './PasswordConfirmation'
import { object, string, ref } from 'yup'
import { Formik } from 'formik'
import { useHistory, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/react-hooks'
import { UPDATE_PASSWORD } from './graphql/mutations'

export default function ResetPasswordPage() {
  const { i18n } = useLingui()
  const history = useHistory()
  const toast = useToast()
  const { resetToken } = useParams()

  const validationSchema = object().shape({
    password: string()
      .required(i18n._(t`Password cannot be empty`))
      .min(12, i18n._(t`Password must be at least 12 characters long`)),
    confirmPassword: string()
      .required(i18n._(t`Password confirmation cannot be empty`))
      .oneOf([ref('password')], i18n._(t`Passwords must match`)),
  })

  const [updatePassword, { loading, error }] = useMutation(UPDATE_PASSWORD, {
    onError(error) {
      toast({
        title: error.message,
        description: i18n._(t`Unable to update password`),
        status: 'error',
        duration: 9000,
        isClosable: true,
      })
    },
    onCompleted() {
      history.push('/sign-in')
      toast({
        title: i18n._(t`Password Updated`),
        description: i18n._(t`You may now sign in with your new password`),
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
    <Box mx="auto">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values) => {
          updatePassword({
            variables: {
              input: {
                resetToken: resetToken,
                password: values.password,
                confirmPassword: values.confirmPassword,
              },
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
            <Stack align="center">
              <Text fontSize="2xl" mb="4">
                <Trans>Enter and confirm your new password.</Trans>
              </Text>
            </Stack>

            <br />

            <PasswordConfirmation mb="4" spacing="4" />

            <Stack spacing={4} isInline>
              <Button
                variantColor="teal"
                type="submit"
                isLoading={isSubmitting}
                id="submitBtn"
              >
                <Trans>Change Password</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Box>
  )
}
