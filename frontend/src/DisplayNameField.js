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

const DisplayNameField = WithPseudoBox(function DisplayNameField({
  name,
  label,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)
  const { i18n } = useLingui()

  const formLabel = label === undefined ? <Trans>Display Name:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor="displayName" fontWeight="bold">
        {formLabel}
      </FormLabel>
      <InputGroup>
        <InputLeftElement>
          <Icon name="person" color="gray.300" size="icons.lg" />
        </InputLeftElement>
        <Input
          {...field}
          {...props}
          ref={forwardedRef}
          id="displayName"
          placeholder={t`Display Name`}
        />
      </InputGroup>

      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  );
})

DisplayNameField.propTypes = {
  name: string.isRequired,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DisplayNameField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DisplayNameField'

export default withForwardedRef
