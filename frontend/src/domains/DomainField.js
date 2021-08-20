import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'
import { t } from '@lingui/macro'

import { FormField } from '../components/FormField'

function DomainField({
  name,
  label,
  placeholder,
  forwardedRef,
  inputProps,
  ...props
}) {
  return (
    <FormField
      name={name}
      label={label}
      placeholder={placeholder}
      ref={forwardedRef}
      inputProps={inputProps}
      {...props}
    />
  )
}

DomainField.propTypes = {
  name: string,
  label: string,
  placeholder: string,
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

DomainField.defaultProps = {
  name: 'domainURL',
  label: t`Domain URL:`,
  placeholder: t`Domain URL`,
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <DomainField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'DomainField'

export { withForwardedRef as DomainField }
