/* eslint-disable react/prop-types */
import React from 'react'
import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { PasswordField } from './PasswordField'
import { object, string } from 'yup'
import {
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  FormErrorMessage,
  FormControl,
  Stack,
  Button,
  Link,
  useToast,
} from '@chakra-ui/core'
import { Link as RouteLink, useHistory } from 'react-router-dom'
import { useMutation } from '@apollo/react-hooks'
import gql from 'graphql-tag'
import { Formik, Field } from 'formik'

export function SignInPage() {
  const history = useHistory()

  const toast = useToast()

  const { i18n } = useLingui()

  const [signIn, { loading, error }] = useMutation(
    gql`
      mutation SignIn($userName: EmailAddress!, $password: String!) {
        signIn(userName: $userName, password: $password) {
          user {
            userName
            tfaValidated
          }
          authToken
        }
      }
    `,
    {
      update(cache, { data: { signIn } }) {
        // write the users token to the cache
        cache.writeData({
          data: {
            jwt: signIn.authToken,
            tfa: signIn.user.tfaValidated,
          },
        })
      },
      onError(e) {
        console.log('Error!', e)
        toast({
          title: i18n._('An error occurred.'),
          description: i18n._(
            'Unable to sign in to your account, please try again.',
          ),
          status: 'error',
          duration: 9000,
          isClosable: true,
        })
      },
      onCompleted() {
        // redirect to the home page.
        history.push('/')
        // Display a welcome message
        toast({
          title: i18n._('Sign In.'),
          description: i18n._('Welcome, you are successfully signed in!'),
          status: 'success',
          duration: 9000,
          isClosable: true,
        })
      },
    },
  )

  const validationSchema = object().shape({
    password: string().required(i18n._('Password cannot be empty')),
    email: string().required(i18n._('Email cannot be empty')),
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  return (
    <Stack spacing={4} mx="auto">
      <Text fontSize="2xl">
        <Trans>Sign in with your username and password.</Trans>
      </Text>

      <Formik
        validationSchema={validationSchema}
        initialValues={{ email: '', password: '' }}
        onSubmit={async (values, _actions) => {
          await signIn({
            variables: { userName: values.email, password: values.password },
          })
        }}
      >
        {props => (
          <form onSubmit={props.handleSubmit}>
            <Field name="email">
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

            <PasswordField name="password" />

            <Link as={RouteLink} to="/forgot-password">
              <Trans>Forgot your password?</Trans>
            </Link>

            <Stack mt={6} spacing={4} isInline>
              <Button
                variantColor="teal"
                isLoading={props.isSubmitting}
                type="submit"
              >
                <Trans>Sign In</Trans>
              </Button>

              <Button
                as={RouteLink}
                to="/create-user"
                variantColor="teal"
                variant="outline"
              >
                <Trans>Create Account</Trans>
              </Button>
            </Stack>
          </form>
        )}
      </Formik>
    </Stack>
  )
}
