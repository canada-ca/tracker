import React from 'react'
import { Trans, t } from '@lingui/macro'
import { Heading, Box, useToast } from '@chakra-ui/core'
import PasswordConfirmation from './PasswordConfirmation'
import { object, string, ref } from 'yup'
import { Formik } from 'formik'
import { useHistory, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { UPDATE_PASSWORD } from './graphql/mutations'
import { TrackerButton } from './TrackerButton'

export default function ResetPasswordPage() {
  const history = useHistory()
  const toast = useToast()
  const { resetToken } = useParams()

  const validationSchema = object().shape({
    password: string()
      .required(t`Password cannot be empty`)
      .min(12, t`Password must be at least 12 characters long`),
    confirmPassword: string()
      .required(t`Password confirmation cannot be empty`)
      .oneOf([ref('password')], t`Passwords must match`),
  })

  const [updatePassword, { loading, error }] = useMutation(UPDATE_PASSWORD, {
    onError(error) {
      toast({
        title: error.message,
        description: t`Unable to update password`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      history.push('/sign-in')
      toast({
        title: t`Password Updated`,
        description: t`You may now sign in with your new password`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
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
    <Box px="8" mx="auto" overflow="hidden">
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
            <Heading as="h1" fontSize="2xl" mb="6" textAlign="center">
              <Trans>Enter and confirm your new password.</Trans>
            </Heading>

            <PasswordConfirmation mb="4" spacing="4" />

            <TrackerButton
              type="submit"
              isLoading={isSubmitting}
              id="submitBtn"
              variant="primary"
              mb="4"
            >
              <Trans>Change Password</Trans>
            </TrackerButton>
          </form>
        )}
      </Formik>
    </Box>
  )
}
