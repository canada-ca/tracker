import React from 'react'
import { Flex, Switch } from '@chakra-ui/react'
import { bool, func } from 'prop-types'
import { UserIcon } from '../theme/Icons'
import { useUserVar } from '../utilities/userState'

export function AffiliationFilterSwitch({ isAffiliated, setIsAffiliated }) {
  const { isLoggedIn } = useUserVar()
  return (
    isLoggedIn() && (
      <Flex align="center" my="2">
        <Switch
          isFocusable={true}
          aria-label="Show only affiliated resources"
          mx="2"
          defaultChecked={isAffiliated}
          onChange={(e) => setIsAffiliated(e.target.checked)}
        />
        <UserIcon color="gray.900" size="lg" />
      </Flex>
    )
  )
}

AffiliationFilterSwitch.propTypes = {
  isAffiliated: bool,
  setIsAffiliated: func,
}
