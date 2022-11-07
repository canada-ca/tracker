import React from 'react'
import PropTypes from 'prop-types'
import { Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

const NoGuidanceText = ({ category }) => {
  return (
    <Text>
      <Trans>There is not currently any guidance for {category}. Please request a scan and check again soon.</Trans>
    </Text>
  )
}

NoGuidanceText.propTypes = {
  category: PropTypes.string.isRequired,
}

export default NoGuidanceText
