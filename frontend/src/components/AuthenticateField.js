import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from '@chakra-ui/react'
import { useField } from 'formik'

import { TwoFactorIcon } from '../theme/Icons'

function AuthenticateField({ name, forwardedRef, sendMethod, ...props }) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const codeSendMessage =
    sendMethod.toLowerCase() === 'email' ? (
      <Trans>
        We've sent you an email with an authentication code to sign into
        Tracker.
      </Trans>
    ) : sendMethod.toLowerCase() === 'phone' ? (
      <Trans>
        We've sent an SMS to your registered phone number with an authentication
        code to sign into Tracker.
      </Trans>
    ) : sendMethod.toLowerCase() === 'verifyphone' ? (
      <Trans>
        We've sent an SMS to your new phone number with an authentication code
        to confirm this change.
      </Trans>
    ) : (
      ''
    )

  return (
    <FormControl isInvalid={meta.error && meta.touched} {...props}>
      <Stack align="center">
        <FormLabel htmlFor="twoFactorCode" fontWeight="bold" mb="2">
          {codeSendMessage}
          <span> </span>
          <Trans>Please enter your two factor code below.</Trans>
        </FormLabel>
        <InputGroup width="fit-content">
          <InputLeftElement aria-hidden="true">
            <TwoFactorIcon color="gray.300" size="1.25rem" />
          </InputLeftElement>
          <Input
            {...field}
            id="twoFactorCode"
            ref={forwardedRef}
            placeholder={i18n._(t`Enter two factor code`)}
            autoFocus
            autoComplete="off"
            inputMode="numeric"
            aria-label={t`Enter your two factor code`}
          />
        </InputGroup>

        <FormErrorMessage>{meta.error}</FormErrorMessage>
      </Stack>
    </FormControl>
  )
}

AuthenticateField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: object })]),
  sendMethod: string.isRequired,
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <AuthenticateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'AuthenticateField'

export { withForwardedRef as AuthenticateField }
