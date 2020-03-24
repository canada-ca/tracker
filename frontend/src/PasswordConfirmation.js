import React from 'react'

import {
  FormControl,
  FormErrorMessage,
  Input,
  InputLeftElement,
  InputGroup,
  Icon,
} from '@chakra-ui/core'

import { Field } from 'formik'

export function PasswordConfirmation() {
  /* A function for the Formik to validate fields in the form */
  function validateField(value) {
    let error
    if (!value || value === '') {
      error = ' can not be empty'
    }
    return error
  }

  return (
    <>
      <Field name="password" validate={validateField}>
        {({ field, form }) => (
          <FormControl
            mt={4}
            mb={4}
            isInvalid={form.errors.password && form.touched.password}
            isRequired
          >
            <InputGroup>
              <InputLeftElement>
                <Icon name="lock" color="gray.300" />
              </InputLeftElement>
              <Input {...field} id="password" placeholder="Password" />
            </InputGroup>
            <FormErrorMessage>Password{form.errors.password}</FormErrorMessage>
          </FormControl>
        )}
      </Field>

      <Field name="confirmPassword" validate={validateField}>
        {({ field, form }) => (
          <FormControl
            mt={4}
            mb={4}
            isInvalid={
              form.errors.confirmPassword && form.touched.confirmPassword
            }
            isRequired
          >
            <InputGroup>
              <InputLeftElement>
                <Icon name="lock" color="gray.300" />
              </InputLeftElement>
              <Input
                {...field}
                id="confirmPassword"
                placeholder="Confirm password"
              />
            </InputGroup>

            <FormErrorMessage>
              Confirm Password{form.errors.confirmPassword}
            </FormErrorMessage>
          </FormControl>
        )}
      </Field>
    </>
  )
}
