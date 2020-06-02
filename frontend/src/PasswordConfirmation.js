import React from 'react'
import { useLingui } from '@lingui/react'
import { t } from '@lingui/macro'
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
  Box,
  Stack,
} from '@chakra-ui/core'
import WithPseudoBox, { withPseudoBoxPropTypes } from './withPseudoBox'
import { Field } from 'formik'
import { string } from 'prop-types'

function PasswordConfirmation({ ...props }) {
  const { i18n } = useLingui()

  const [icon, setIcon] = React.useState('lock')
  const [confirmIcon, setConfirmIcon] = React.useState('lock')

  const [passwordShow, setPasswordShow] = React.useState(false)
  const handlePasswordShow = () => setPasswordShow(!passwordShow)

  const [confirmShow, setConfirmShow] = React.useState(false)
  const handleConfirmShow = () => setConfirmShow(!confirmShow)

  // TODO: Is there another place to validate this?
  /* A function for the Formik to validate fields in the form */
  function validatePassword(value) {
    setIcon('spinner')
    if (value === '') {
      setIcon('close')
    } else if (String(value).length < 12) {
      setIcon('close')
    } else {
      setIcon('check')
    }
  }

  // TODO: Is there another place to validate this?
  /* A function for the Formik to validate fields in the form */
  function validateConfirmPassword(value) {
    setConfirmIcon('spinner')
    if (value === '') {
      setConfirmIcon('close')
    } else if (value !== document.getElementById('password').value) {
      setConfirmIcon('close')
    } else {
      setConfirmIcon('check')
    }
  }

  return (
    <Stack {...props}>
      <Box>
        <Field name="password" validate={validatePassword}>
          {({ field, form }) => (
            <FormControl
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
                  placeholder={i18n._(t`Password`)}
                  type={passwordShow ? 'text' : 'password'}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    id="passShowButton"
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
      </Box>

      <Box>
        <Field name="confirmPassword" validate={validateConfirmPassword}>
          {({ field, form }) => (
            <FormControl
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
                  placeholder={i18n._(t`Confirm password`)}
                  type={confirmShow ? 'text' : 'password'}
                />
                <InputRightElement width="4.5rem">
                  <Button
                    id="confShowButton"
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
      </Box>
    </Stack>
  )
}

PasswordConfirmation.propTypes = {
  ...withPseudoBoxPropTypes,
  spacing: string,
}

export default WithPseudoBox(PasswordConfirmation)
