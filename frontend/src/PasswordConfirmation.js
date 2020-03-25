import React from 'react'

import {
  FormControl,
  FormErrorMessage,
  Input,
  InputLeftElement,
  InputGroup,
  Icon,
  Spinner,
} from '@chakra-ui/core'

import { Field } from 'formik'

export function PasswordConfirmation() {
  const [icon, setIcon] = React.useState('lock')
  const [confirmIcon, setConfirmIcon] = React.useState('lock')

  /* A function for the Formik to validate fields in the form */
  function validatePassword(value) {
    setIcon('spinner')
    setTimeout(() => {
      if (value === '') {
        setIcon('close')
        return ' can not be empty'
      } else if (String(value).length < 11) {
        setIcon('close')
        return ' must be 12 chars long'
      } else {
        setIcon('check')
      }
    }, 700)
     if (value === '') {
        return ' can not be empty'
      } else if (String(value).length < 11) {
        return ' must be 12 chars long'
      } 
  }

  /* A function for the Formik to validate fields in the form */
  function validateConfirmPassword(value) {
    setConfirmIcon('spinner')
    setTimeout(() => {
      if (value === '') {
        setConfirmIcon('close')
        return ' can not be empty'
      } else if (value !== document.getElementById('password').value) {
        setConfirmIcon('close')
        return ' must match password'
      } else {
        setConfirmIcon('check')
      }
    }, 700)
    if (value === '') {
        return ' can not be empty'
      } else if (value !== document.getElementById('password').value) {
        return ' must match password'
      }
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
                {icon === 'spinner' ? (
                  <Spinner size="sm" color="gray.300" />
                ) : (
                  <Icon
                    role="passwordIcon"
                    name={icon}
                    color={
                      icon === 'lock'
                        ? 'gray.300'
                        : icon === 'check'
                        ? 'green.500'
                        : 'red.500'
                    }
                  />
                )}
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
                {confirmIcon === 'spinner' ? (
                  <Spinner size="sm" color="gray.300" />
                ) : (
                  <Icon
                    role="confirmPasswordIcon"
                    name={confirmIcon}
                    color={
                      confirmIcon === 'lock'
                        ? 'gray.300'
                        : confirmIcon === 'check'
                        ? 'green.500'
                        : 'red.500'
                    }
                  />
                )}
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
