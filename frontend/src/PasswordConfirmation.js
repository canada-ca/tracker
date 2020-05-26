import React from 'react'

import {
  FormControl,
  FormErrorMessage,
  Input,
  InputLeftElement,
  InputRightElement,
  InputGroup,
  Icon,
  Spinner,
  Button,
} from '@chakra-ui/core'

import { Field } from 'formik'

export function PasswordConfirmation() {
  const [icon, setIcon] = React.useState('lock')
  const [confirmIcon, setConfirmIcon] = React.useState('lock')

  const [passwordShow, setPasswordShow] = React.useState(false)
  const handlePasswordShow = () => setPasswordShow(!passwordShow)

  const [confirmShow, setConfirmShow] = React.useState(false)
  const handleConfirmShow = () => setConfirmShow(!confirmShow)

  // TODO: Is there another place to valid this?
  /* A function for the Formik to validate fields in the form */
  function validatePassword(value) {
    setIcon('spinner')
    setTimeout(() => {
      if (value === '') {
        setIcon('close')
      } else if (String(value).length < 11) {
        setIcon('close')
      } else {
        setIcon('check')
      }
    }, 600)
  }

  // TODO: Is there another place to valid this?
  /* A function for the Formik to validate fields in the form */
  function validateConfirmPassword(value) {
    setConfirmIcon('spinner')
    setTimeout(() => {
      if (value === '') {
        setConfirmIcon('close')
      } else if (value !== document.getElementById('password').value) {
        setConfirmIcon('close')
      } else {
        setConfirmIcon('check')
      }
    }, 600)
  }

  return (
    <>
      <Field name="password" validate={validatePassword}>
        {({ field, form }) => (
          <FormControl
            mt={4}
            mb={4}
            isInvalid={form.errors.password && form.touched.password}
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
              <Input
                {...field}
                id="password"
                placeholder="Password"
                type={passwordShow ? 'text' : 'password'}
              />
              <InputRightElement width="4.5rem">
                <Button
                  id="showButton"
                  h="1.75rem"
                  size="sm"
                  onClick={handlePasswordShow}
                >
                  <Icon name={passwordShow ? 'view-off' : 'view'} />
                </Button>
              </InputRightElement>
            </InputGroup>
            <FormErrorMessage>{form.errors.password}</FormErrorMessage>
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
          >
            <InputGroup>
              <InputLeftElement>
                {confirmIcon === 'spinner' ? (
                  <Spinner size="sm" color="gray.300" />
                ) : (
                  <Icon
                    role="img"
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
                type={confirmShow ? 'text' : 'password'}
              />
              <InputRightElement width="4.5rem">
                <Button
                  id="showButton"
                  h="1.75rem"
                  size="sm"
                  onClick={handleConfirmShow}
                >
                  <Icon name={confirmShow ? 'view-off' : 'view'} />
                </Button>
              </InputRightElement>
            </InputGroup>

            <FormErrorMessage>{form.errors.confirmPassword}</FormErrorMessage>
          </FormControl>
        )}
      </Field>
    </>
  )
}
