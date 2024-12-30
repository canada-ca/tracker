import React from 'react'
import { Flex, Switch, Tooltip } from '@chakra-ui/react'
import { bool, func } from 'prop-types'
import { UserIcon } from '../theme/Icons'
import { t } from '@lingui/macro'
import { useUserVar } from '../utilities/userState'

export function AffiliationFilterSwitch({ isAffiliated, setIsAffiliated, resetToFirstPage }) {
  const { isLoggedIn } = useUserVar()
  if (!isLoggedIn()) return null
  return (
    <Tooltip label={t`Filter list to affiliated resources only.`} hasArrow>
      <Flex align="center" my="2" maxW="5rem" className="filter-affiliated">
        <Switch
          isFocusable={true}
          aria-label="Filter list to affiliated resources only."
          mx="2"
          defaultChecked={isAffiliated}
          onChange={(e) => {
            setIsAffiliated(e.target.checked)
            resetToFirstPage()
          }}
        />
        <UserIcon color="gray.900" size="lg" />
      </Flex>
    </Tooltip>
  )
}

AffiliationFilterSwitch.propTypes = {
  isAffiliated: bool,
  setIsAffiliated: func,
  resetToFirstPage: func,
}
