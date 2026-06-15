import React from 'react'
import { Badge } from '@chakra-ui/react'
import { object } from 'prop-types'

import withSuperAdmin from '../app/withSuperAdmin'
import { Trans } from '@lingui/react/macro'

const PolicyBadges = withSuperAdmin(({ policies, ...props }) => (
  <>
    {policies?.psd && (
      <Badge colorScheme="blue" variant="solid" {...props}>
        <Trans>PSD</Trans>
      </Badge>
    )}
    {policies?.pgs && (
      <Badge colorScheme="purple" variant="solid" {...props}>
        <Trans>PGS</Trans>
      </Badge>
    )}
  </>
))

PolicyBadges.propTypes = {
  policies: object,
}

export default PolicyBadges
