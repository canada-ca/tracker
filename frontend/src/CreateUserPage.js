import React from 'react'
import { Button, Stack, Text, useToast } from '@chakra-ui/core'
import { useMutation } from '@apollo/react-hooks'
import { object, string } from 'yup'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { Formik } from 'formik'
import { CREATE_USER } from './graphql/mutations'
import { EmailField } from './EmailField'
import { PasswordConfirmation } from './PasswordConfirmation'

const validationSchema = object().shape({
  email: string().required('cannot be empty'),
  password: string().required('cannot be empty'),
  confirmPassword: string().required('cannot be empty'),
})

export function CreateUserPage() {
  const [createUser, { loading, error, data }] = useMutation(CREATE_USER)

  const history = useHistory()
  const toast = useToast()

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  if (data) {
    if (data.error) {
      // Switch statement to handle the errors that we expect could come back from the API.
    } else {
      history.push('/')
      toast({
        title: 'Account created.',
        description: "We've created your account for you, please sign in!",
        status: 'success',
        duration: 9000,
        isClosable: true,
      })
    }
  }

  return (
    <Stack spacing={2} mx="auto">
      <Text mb={4} fontSize="2xl">
        Create an account by entering an email and password.
      </Text>
      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        onSubmit={async (values) => {
          console.log('values', values)
          createUser({
            variables: {
              userName: values.email,
              password: values.password,
              confirmPassword: values.confirmPassword,
              displayName: values.email,
            },
          })
        }}
      >
        {({ handleSubmit, isSubmitting }) => (
          <form id="form" onSubmit={handleSubmit}>
            <EmailField name="email" />

            <PasswordConfirmation />

            <Stack mt={6} spacing={4} isInline>
              <Button
                variantColor="teal"
                isLoading={isSubmitting}
                type="submit"
                id="submitBtn"
              >
                Create Account
              </Button>

              <Button
                as={RouteLink}
                to="/sign-in"
                variantColor="teal"
                variant="outline"
              >
                Back
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}
