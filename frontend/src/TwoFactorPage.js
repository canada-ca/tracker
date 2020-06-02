/* eslint-disable react/prop-types */
import React from 'react'
import {
  Stack,
  Text,
  FormControl,
  FormErrorMessage,
  Input,
  InputLeftElement,
  InputGroup,
  Icon,
  Button,
} from '@chakra-ui/core'
import { Formik, Field } from 'formik'
import { useMutation } from '@apollo/react-hooks'
import { VALIDATE_TWO_FACTOR } from './graphql/mutations'

export function TwoFactorPage() {
  const [validateOTP, { loading, error, data }] = useMutation(
    VALIDATE_TWO_FACTOR,
  )

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  if (data) {
    if (data.error) {
      console.log(error)
    }
    console.log(data.authenticateTwoFactor)
    // Do something with the data.  Ie: Redirect if no error?
  }

  /* A function for the Formik to validate fields in the form */
  function validateCode(value) {
    let error
    if (!value || value === '') {
      error = 'Field can not be empty'
    } else if (value.match(/[a-z]/i)) {
      error = 'Code must be numbers only'
    } else if (value.length !== 6) {
      error = 'Code must be six characters'
    }
    return error
  }

  return (
    <Stack spacing={4} mx="auto">
      <Text fontSize="2xl">Validate your Two-Factor Code</Text>

      <Formik
        initialValues={{ email: '', password: '', otpCode: '' }}
        onSubmit={async (values, actions) => {
          validateOTP({
            variables: { userName: values.email, otpCode: values.otpCode },
          })
          actions.setSubmitting(false)
        }}
      >
        {(props) => (
          <form onSubmit={props.handleSubmit}>
            <Field name="otpCode" validate={validateCode}>
              {({ field, form }) => (
                <FormControl
                  mt={4}
                  mb={4}
                  isInvalid={form.errors.otpCode && form.touched.otpCode}
                >
                  <InputGroup>
                    <InputLeftElement color="gray.300" fontSize="1.2em">
                      <Icon name="lock" color="gray.300" />
                    </InputLeftElement>
                    <Input
                      {...field}
                      id="otpCode"
                      placeholder="Two-factor code"
                    />
                  </InputGroup>
                  <FormErrorMessage>{form.errors.otpCode}</FormErrorMessage>
                </FormControl>
              )}
            </Field>

            <Button
              variantColor="teal"
              isLoading={props.isSubmitting}
              type="submit"
            >
              Verify
            </Button>
          </form>
        )}
      </Formik>
    </Stack>
  )
}
