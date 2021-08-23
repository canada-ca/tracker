import React from 'react'
import { func, object, oneOfType, shape, string } from 'prop-types'

import { FormField } from './FormField'

function OrganizationCreateField({
  name,
  label,
  language,
  forwardedRef,
  inputProps,
  ...props
}) {
  return (
    <FormField
      name={name}
      label={`${label} (${language})`}
      placeholder={`${label} (${language})`}
      ref={forwardedRef}
      inputProps={inputProps}
      {...props}
    />
  )
}

OrganizationCreateField.propTypes = {
  name: string.isRequired,
  label: string,
  language: string,
  inputProps: object,
  forwardedRef: oneOfType([func, shape({ current: object })]),
}

const withForwardedRef = React.forwardRef((props, ref) => {
  return <OrganizationCreateField {...props} forwardedRef={ref} />
})
withForwardedRef.displayName = 'OrganizationCreateField'

export { withForwardedRef as CreateOrganizationField }
