import React from 'react'
import {
  elementType,
  func,
  oneOfType,
  shape,
  string,
} from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  FormErrorMessage,
  FormLabel,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'

const AuthenticateField = WithPseudoBox(function AuthenticateField({
  name,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="twoFactorCode" fontWeight="bold" mb="2">
        <Trans>Please enter your two factor code below.</Trans>
      </FormLabel>
      <InputGroup>
        <InputLeftElement>
          <Icon name="twoFactor" color="gray.300" size="1.25rem"/>
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          id="twoFactorCode"
          ref={forwardedRef}
          placeholder={i18n._(t`Enter two factor code`)}
          autoFocus
          inputMode="numeric"
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
})

AuthenticateField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <AuthenticateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'AuthenticateField'

export default withForwardedRef
