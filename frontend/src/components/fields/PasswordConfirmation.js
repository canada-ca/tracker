import React from 'react'
import { object, string } from 'prop-types'
import { t } from '@lingui/macro'
import { IconButton, Spinner, Stack } from '@chakra-ui/react'
import {
  CheckIcon,
  CloseIcon,
  LockIcon,
  ViewIcon,
  ViewOffIcon,
} from '@chakra-ui/icons'

import { FormField } from './FormField'

export function PasswordConfirmation({
  passwordLabel,
  confirmPasswordLabel,
  inputProps,
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
      <FormField
        name="password"
        label={passwordLabel}
        leftElement={
          icon === 'spinner' ? (
            <Spinner size="sm" color="gray.300" />
          ) : icon === 'lock' ? (
            <LockIcon color="gray.300" aria-label="initial icon" />
          ) : icon === 'check' ? (
            <CheckIcon color="green.500" />
          ) : icon === 'close' ? (
            <CloseIcon color="red.500" aria-label="invalid password" />
          ) : (
            <></>
          )
        }
        rightElement={
          <IconButton
            id="showPassword"
            aria-label={passwordShow ? 'hide password' : 'show password'}
            onClick={handlePasswordShow}
            h="buttons.lg"
            mr={8}
            icon={passwordShow ? <ViewOffIcon /> : <ViewIcon />}
          />
        }
        type={passwordShow ? 'text' : 'password'}
        placeholder={t`Password`}
        useFieldInput={{
          name: 'password',
          validate: validatePassword,
        }}
        inputProps={inputProps}
        {...props}
      />

      <FormField
        name="confirmPassword"
        label={confirmPasswordLabel}
        leftElement={
          confirmIcon === 'spinner' ? (
            <Spinner size="sm" color="gray.300" />
          ) : confirmIcon === 'lock' ? (
            <LockIcon color="gray.300" />
          ) : confirmIcon === 'check' ? (
            <CheckIcon color="green.500" />
          ) : confirmIcon === 'close' ? (
            <CloseIcon color="red.500" />
          ) : (
            <></>
          )
        }
        rightElement={
          <IconButton
            id="showPasswordConfirm"
            aria-label={confirmShow ? 'hide password' : 'show password'}
            onClick={handleConfirmShow}
            h="buttons.lg"
            mr={8}
            icon={confirmShow ? <ViewOffIcon /> : <ViewIcon />}
          />
        }
        type={confirmShow ? 'text' : 'password'}
        placeholder={t`Password`}
        useFieldInput={{
          name: 'confirmPassword',
          validate: validateConfirmPassword,
        }}
        inputProps={inputProps}
        {...props}
      />
    </Stack>
  )
}

PasswordConfirmation.propTypes = {
  passwordLabel: string,
  confirmPasswordLabel: string,
  inputProps: object,
}

PasswordConfirmation.defaultProps = {
  passwordLabel: t`Password:`,
  confirmPasswordLabel: t`Confirm Password:`,
}
