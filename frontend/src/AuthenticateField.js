import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'

const AuthenticateField = WithPseudoBox(function AuthenticateField({
  name,
  forwardedRef,
  sendMethod,
  ...props
}) {
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
    <FormControl isInvalid={meta.error && meta.touched}>
      <Stack align="center">
        <FormLabel
          htmlFor="twoFactorCode"
          fontWeight="bold"
          mb="2"
          textAlign={['center', 'left']}
        >
          {codeSendMessage}
          <Trans>Please enter your two factor code below.</Trans>
        </FormLabel>
        <InputGroup width="fit-content">
          <InputLeftElement>
            <Icon name="twoFactor" color="gray.300" size="1.25rem" />
          </InputLeftElement>
          <Input
            {...field}
            {...props}
            id="twoFactorCode"
            ref={forwardedRef}
            placeholder={i18n._(t`Enter two factor code`)}
            autoFocus
            autoComplete="off"
            inputMode="numeric"
          />
        </InputGroup>

        <FormErrorMessage>{meta.error}</FormErrorMessage>
      </Stack>
    </FormControl>
  )
})

AuthenticateField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
  sendMethod: string.isRequired,
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <AuthenticateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'AuthenticateField'

export default withForwardedRef
