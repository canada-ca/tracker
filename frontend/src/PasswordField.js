import React from 'react'
import { elementType, func, oneOfType, shape, string } from 'prop-types'
import { t, Trans } from '@lingui/macro'
import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from '@chakra-ui/react'
import { useField } from 'formik'
import WithWrapperBox from './WithWrapperBox.js'

const PasswordField = WithWrapperBox(function PasswordField({
  name,
  label,
  forwardedRef,
  ...props
}) {
  const [field, meta] = useField(name)
  const [show, setShow] = React.useState(false)
  const handleClick = () => setShow(!show)

  const labelText = label === undefined ? <Trans>Password:</Trans> : label

  return (
    <FormControl isInvalid={meta.error && meta.touched}>
      <FormLabel htmlFor={name} fontWeight="bold">
        {labelText}
      </FormLabel>
      <InputGroup size="md">
        <InputLeftElement>
          <Icon name="lock" color="gray.300" />
        </InputLeftElement>

        <Input
          pr="4.5rem"
          type={show ? 'text' : 'password'}
          placeholder={t`Password`}
          id={name}
          ref={forwardedRef}
          {...field}
          {...props}
        />
        <InputRightElement width="width.4">
          <IconButton
            id="showPassword"
            aria-label={show ? 'hide password' : 'show password'}
            h="buttons.lg"
            onClick={handleClick}
            icon={show ? 'view-off' : 'view'}
            tabIndex="-1"
          />
        </InputRightElement>
      </InputGroup>
      <FormErrorMessage>{meta.error}</FormErrorMessage>
    </FormControl>
  )
})

PasswordField.propTypes = {
  name: string.isRequired,
  label: string,
  forwardedRef: oneOfType([func, shape({ current: elementType })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <PasswordField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'PasswordField'

export default withForwardedRef
