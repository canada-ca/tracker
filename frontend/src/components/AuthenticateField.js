import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t } from '@lingui/macro'

import { FormField } from './FormField'

import { TwoFactorIcon } from '../theme/Icons'

function AuthenticateField({
  name,
  forwardedRef,
  sendMethod,
  inputProps,
  ...props
}) {
  const codeSendMessage =
    sendMethod.toLowerCase() === 'email'
      ? t`
        We've sent you an email with an authentication code to sign into
        Tracker.`
      : sendMethod.toLowerCase() === 'phone'
      ? t`
        We've sent an SMS to your registered phone number with an authentication
        code to sign into Tracker.`
      : sendMethod.toLowerCase() === 'verifyphone'
      ? t`
        We've sent an SMS to your new phone number with an authentication code
        to confirm this change.`
      : ''

  return (
    <FormField
      name={name}
      label={
        codeSendMessage + ' ' + t`Please enter your two factor code below.`
      }
      leftElement={<TwoFactorIcon color="gray.300" size="1.25rem" />}
      placeholder={t`Enter two factor code`}
      ref={forwardedRef}
      autoFocus
      autoComplete="off"
      inputMode="numeric"
      w="auto"
      align="center"
      inputProps={inputProps}
      aria-label={t`Enter your two factor code`}
      {...props}
    />
  )
}

AuthenticateField.propTypes = {
  name: string,
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
  sendMethod: string.isRequired,
}

AuthenticateField.defaultProps = {
  name: 'twoFactorCode',
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <AuthenticateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'AuthenticateField'

export { withForwardedRef as AuthenticateField }
