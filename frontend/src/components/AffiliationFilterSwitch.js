import React from 'react'
import { Flex, Switch, Tooltip } from '@chakra-ui/react'
import { bool, func } from 'prop-types'
import { UserIcon } from '../theme/Icons'
import { useUserVar } from '../utilities/userState'
import { t } from '@lingui/macro'

export function AffiliationFilterSwitch({ isAffiliated, setIsAffiliated }) {
  const { isLoggedIn } = useUserVar()
  return (
    isLoggedIn() && (
      <Flex align="center" my="2">
        <Tooltip label={t`Filter list to affiliated resources only.`}>
          <Switch
            isFocusable={true}
            aria-label="Filter list to affiliated resources only."
            mx="2"
            defaultChecked={isAffiliated}
            onChange={(e) => setIsAffiliated(e.target.checked)}
          />
          <UserIcon color="gray.900" size="lg" />
        </Tooltip>
      </Flex>
    )
  )
}

AffiliationFilterSwitch.propTypes = {
  isAffiliated: bool,
  setIsAffiliated: func,
}
