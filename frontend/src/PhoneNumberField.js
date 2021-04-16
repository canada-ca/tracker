import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/core'
import { useField } from 'formik'
import WithPseudoBox from './withPseudoBox'
import { fieldRequirements } from './fieldRequirements'

const PhoneNumberField = WithPseudoBox(function PhoneNumberField({
  name,
  label,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const labelText = label === undefined ? <Trans>Phone Number:</Trans> : label

  const errorText =
    meta.error !== i18n._(fieldRequirements.phoneNumber.matches.message) ? (
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    ) : (
      ''
    )

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="phoneNumber" fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup>
        <InputLeftElement>
          <Icon name="phone" color="gray.300" />
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          id="phoneNumber"
          type="phoneNumber"
          ref={forwardedRef}
          placeholder={i18n._(t`Phone Number`)}
        />
      </InputGroup>

      <FormHelperText>
        {i18n._(fieldRequirements.phoneNumber.matches.message)}
      </FormHelperText>

      {errorText}
    </FormControl>
  )
})

PhoneNumberField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <PhoneNumberField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'PhoneNumberField'

export default withForwardedRef
