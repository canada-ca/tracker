import React from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  FormControl,
  FormErrorMessage,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Stack,
} from '@chakra-ui/react'
import {
  CheckIcon,
  CloseIcon,
  LockIcon,
  ViewIcon,
  ViewOffIcon,
} from '@chakra-ui/icons'
import { useField } from 'formik'
import { string } from 'prop-types'

export default function PasswordConfirmation({
  passwordLabel,
  confirmPasswordLabel,
  ...props
}) {
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
            <InputLeftElement aria-hidden="true">
              {icon === 'spinner' && <Spinner size="sm" color="gray.300" />}
              {icon === 'lock' && (
                <LockIcon color="gray.300" aria-label="initial icon" />
              )}
              {icon === 'check' && <CheckIcon color="green.500" />}
              {icon === 'close' && (
                <CloseIcon color="red.500" aria-label="invalid password" />
              )}
            </InputLeftElement>
            <Input
              {...passwordField}
              id="password"
              placeholder={t`Password`}
              type={passwordShow ? 'text' : 'password'}
            />
            <InputRightElement width="width.4">
              <IconButton
                id="showPassword"
                aria-label={passwordShow ? 'hide password' : 'show password'}
                h="buttons.lg"
                onClick={handlePasswordShow}
                icon={passwordShow ? <ViewOffIcon /> : <ViewIcon />}
              />
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
            <InputLeftElement aria-hidden="true">
              {confirmIcon === 'spinner' && (
                <Spinner size="sm" color="gray.300" />
              )}
              {confirmIcon === 'lock' && <LockIcon color="gray.300" />}
              {confirmIcon === 'check' && <CheckIcon color="green.500" />}
              {confirmIcon === 'close' && <CloseIcon color="red.500" />}
            </InputLeftElement>
            <Input
              {...confirmPasswordField}
              id="confirmPassword"
              placeholder={t`Confirm password`}
              type={confirmShow ? 'text' : 'password'}
            />
            <InputRightElement width="width.4">
              <IconButton
                id="showPasswordConfirm"
                aria-label={confirmShow ? 'hide password' : 'show password'}
                h="buttons.lg"
                onClick={handleConfirmShow}
                icon={confirmShow ? <ViewOffIcon /> : <ViewIcon />}
              />
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
