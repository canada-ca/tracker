/* eslint-disable react/prop-types */
import React from 'react'
import {
  Button,
  FormControl,
  FormErrorMessage,
  Input,
  InputLeftElement,
  InputGroup,
  Stack,
  Text,
  useToast,
  Icon,
} from '@chakra-ui/core'
import { useMutation } from '@apollo/react-hooks'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { Field, Formik } from 'formik'
import CREATE_USER from './graphql/mutations/createUser'
import { PasswordConfirmation } from './PasswordConfirmation'

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

  /* A function for the Formik to validate fields in the form */
  function validateEmail(value) {
    let error
    if (!value || value === '') {
      error = ' can not be empty'
    }
    return error
  }

  return (
    <Stack spacing={2} mx="auto">
      <Text mb={4} fontSize="2xl">
        Create an account by entering an email and password.
      </Text>
      <Formik
        initialValues={{ email: '', password: '', confirmPassword: '' }}
        onSubmit={(values, actions) => {
          setTimeout(() => {
            createUser({
              variables: {
                userName: values.email,
                password: values.password,
                confirmPassword: values.confirmPassword,
                displayName: values.email,
              },
            })
            actions.setSubmitting(false)
          }, 500)
        }}
      >
        {props => (
          <form id="form" onSubmit={props.handleSubmit}>
            <Field name="email" validate={validateEmail}>
              {({ field, form }) => (
                <FormControl
                  mt={4}
                  mb={4}
                  isInvalid={form.errors.email && form.touched.email}
                  isRequired
                >
                  <InputGroup>
                    <InputLeftElement>
                      <Icon name="email" color="gray.300" />
                    </InputLeftElement>
                    <Input {...field} id="email" placeholder="Email" />
                  </InputGroup>

                  <FormErrorMessage>Email{form.errors.email}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <PasswordConfirmation />

            <Stack mt={6} spacing={4} isInline>
              <Button
                variantColor="teal"
                isLoading={props.isSubmitting}
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
