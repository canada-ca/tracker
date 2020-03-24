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
  const [icon, setIcon] = React.useState('lock')
  const [confirmIcon, setConfirmIcon] = React.useState('lock')

  /* A function for the Formik to validate fields in the form */
  function validatePassword(value) {
    if (!value || value === '') {
      setIcon('close')
      return ' can not be empty'
    } else {
      console.log('valid')
      setIcon('check')
    }
  }

  /* A function for the Formik to validate fields in the form */
  function validateConfirmPassword(value) {
    let error

    if (!value || value === '') {
      error = ' can not be empty'
      setConfirmIcon('close')
    } else if (value !== document.getElementById('password').value) {
      error = ' must match password'
      setConfirmIcon('close')
    } else {
      console.log('valid')
      setConfirmIcon('check')
    }

    return error
  }

  return (
    <>
      <Field name="password" validate={validatePassword}>
        {({ field, form }) => (
          <FormControl
            mt={4}
            mb={4}
            isInvalid={form.errors.password && form.touched.password}
            isRequired
          >
            <InputGroup>
              <InputLeftElement>
                <Icon
                  name={icon}
                  color={
                    icon === 'lock'
                      ? 'gray.300'
                      : icon === 'check'
                      ? 'green.500'
                      : 'red.500'
                  }
                />
              </InputLeftElement>
              <Input {...field} id="password" placeholder="Password" />
            </InputGroup>
            <FormErrorMessage>Password{form.errors.password}</FormErrorMessage>
          </FormControl>
        )}
      </Field>

      <Field name="confirmPassword" validate={validateConfirmPassword}>
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
                <Icon
                  name={confirmIcon}
                  color={
                    confirmIcon === 'lock'
                      ? 'gray.300'
                      : confirmIcon === 'check'
                      ? 'green.500'
                      : 'red.500'
                  }
                />
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
