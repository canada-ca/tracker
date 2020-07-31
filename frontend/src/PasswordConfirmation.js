import React from 'react'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
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
  FormLabel,
} from '@chakra-ui/core'
import WithPseudoBox from './withPseudoBox'
import { useField } from 'formik'
import { string } from 'prop-types'

function PasswordConfirmation({
  passwordLabel,
  confirmPasswordLabel,
  ...props
}) {
  const { i18n } = useLingui()

  const [icon, setIcon] = React.useState('lock')
  const [confirmIcon, setConfirmIcon] = React.useState('lock')

  const [passwordShow, setPasswordShow] = React.useState(false)
  const handlePasswordShow = () => setPasswordShow(!passwordShow)

  const [confirmShow, setConfirmShow] = React.useState(false)
  const handleConfirmShow = () => setConfirmShow(!confirmShow)

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
  const [passwordField, passwordMeta] = useField({
    name: 'password',
    validate: validatePassword,
  })

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
  const [confirmPasswordField, confirmPasswordMeta] = useField({
    name: 'confirmPassword',
    validate: validateConfirmPassword,
  })

  const passwordLabelText =
    passwordLabel === undefined ? <Trans>Password:</Trans> : passwordLabel
  const confirmPasswordLabelText =
    confirmPasswordLabel === undefined ? (
      <Trans>Confirm Password:</Trans>
    ) : (
      confirmPasswordLabel
    )

  return (
    <Stack {...props}>
      <Box>
        <FormControl isInvalid={passwordMeta.error && passwordMeta.touched}>
          <FormLabel htmlFor="password" fontWeight="bold">
            {passwordLabelText}
          </FormLabel>
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
              {...passwordField}
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
          <FormErrorMessage>{passwordMeta.error}</FormErrorMessage>
        </FormControl>
      </Box>

      <Box>
        <FormControl
          isInvalid={confirmPasswordMeta.error && confirmPasswordMeta.touched}
        >
          <FormLabel htmlFor="confirmPassword" fontWeight="bold">
            {confirmPasswordLabelText}
          </FormLabel>
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
              {...confirmPasswordField}
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

          <FormErrorMessage>{confirmPasswordMeta.error}</FormErrorMessage>
        </FormControl>
      </Box>
    </Stack>
  )
}

PasswordConfirmation.propTypes = {
  spacing: string,
  passwordLabel: string,
  confirmPasswordLabel: string,
}

export default WithPseudoBox(PasswordConfirmation)
