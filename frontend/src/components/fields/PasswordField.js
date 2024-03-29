import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t } from '@lingui/macro'
import { IconButton } from '@chakra-ui/react'
import { LockIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { FormField } from './FormField'

function PasswordField({ forwardedRef, name, label, inputProps, ...props }) {
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  return (
    <FormField
      name={name}
      label={label}
      leftElement={<LockIcon color="gray.300" />}
      rightElement={
        <IconButton
          id={'show' + name.charAt(0).toUpperCase() + name.slice(1)}
          aria-label={show ? 'hide password' : 'show password'}
          onClick={handleClick}
          h="buttons.lg"
          mr={8}
          icon={show ? <ViewOffIcon /> : <ViewIcon />}
        />
      }
      type={show ? 'text' : 'password'}
      placeholder={t`Password`}
      ref={forwardedRef}
      inputProps={inputProps}
      {...props}
    />
  )
}

PasswordField.propTypes = {
  name: string,
  label: string,
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

PasswordField.defaultProps = {
  name: 'password',
  label: t`Password:`,
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <PasswordField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'PasswordField'

export { withForwardedRef as PasswordField }
