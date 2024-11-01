import React from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Button, Heading, Text, useToast } from '@chakra-ui/react'
import { object, ref, string } from 'yup'
import { Formik } from 'formik'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation } from '@apollo/client'

import { PasswordConfirmation } from '../components/fields/PasswordConfirmation'
import { LoadingMessage } from '../components/LoadingMessage'
import { RESET_PASSWORD } from '../graphql/mutations'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
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

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
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
    onCompleted({ resetPassword }) {
      if (resetPassword.result.__typename === 'ResetPasswordResult') {
        navigate('/sign-in')
        toast({
          title: t`Password Updated`,
          description: t`You may now sign in with your new password`,
          status: 'success',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else if (resetPassword.result.__typename === 'ResetPasswordError') {
        toast({
          title: t`Unable to reset your password, please try again.`,
          description: resetPassword.result.description,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      } else {
        toast({
          title: t`Incorrect send method received.`,
          description: t`Incorrect resetPassword.result typename.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
        console.log('Incorrect resetPassword.result typename.')
      }
    },
  })

  if (loading) return <LoadingMessage />

  return (
    <Box px="4" mx="auto" overflow="hidden" w="100%">
      <Formik
        validationSchema={validationSchema}
        initialValues={{
          password: '',
          confirmPassword: '',
        }}
        onSubmit={async (values) => {
          resetPassword({
            variables: {
              password: values.password,
              confirmPassword: values.confirmPassword,
              resetToken: resetToken,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit} role="form" aria-label="form" name="form">
            <Heading as="h1" fontSize="3xl" mb="8" textAlign={{ lg: 'left', md: 'center' }}>
              <Trans>Reset Password</Trans>
            </Heading>

            <Box mb="8">
              <Text fontSize="lg" mb="2">
                <Trans>Enter and confirm your new password.</Trans>
              </Text>
            </Box>

            <Box w={{ md: '100%', lg: '33%' }}>
              <PasswordConfirmation mb="4" />
            </Box>

            <Button w={['100%', '33%']} type="submit" isLoading={isSubmitting} id="submitBtn" variant="primary" mb="4">
              <Trans>Change Password</Trans>
            </Button>
          </form>
        )}
      </Formik>
    </Box>
  )
}
