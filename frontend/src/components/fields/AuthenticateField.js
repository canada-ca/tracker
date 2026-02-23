import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t } from '@lingui/macro'

import { Field } from 'formik'
import { FormControl, FormLabel, HStack, PinInput, PinInputField } from '@chakra-ui/react'

function AuthenticateField({ name = 'twoFactorCode', sendMethod }) {
  const codeSendMessage =
    sendMethod.toLowerCase() === 'email'
      ? t`We've sent you an email with an authentication code to sign into Tracker.`
      : sendMethod.toLowerCase() === 'phone'
      ? t`We've sent an SMS to your registered phone number with an authentication code to sign into Tracker.`
      : sendMethod.toLowerCase() === 'verifyphone'
      ? t`We've sent an SMS to your new phone number with an authentication code to confirm this change.`
      : ''

  return (
    <Field name={name}>
      {({ field, form }) => (
        <FormControl id={name}>
          <FormLabel htmlFor={name} fontWeight="bold" textAlign="center">
            {codeSendMessage + ' ' + t`Please enter your two factor code below.`}
          </FormLabel>
          <HStack justify="center">
            <PinInput
              id={name}
              otp
              type="number"
              autoFocus
              name={name}
              onChange={(val) => form.setFieldValue(field.name, val)}
            >
              <PinInputField borderColor="black" />
              <PinInputField borderColor="black" />
              <PinInputField borderColor="black" />
              <PinInputField borderColor="black" />
              <PinInputField borderColor="black" />
              <PinInputField borderColor="black" />
            </PinInput>
          </HStack>
        </FormControl>
      )}
    </Field>
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
