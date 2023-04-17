import React, { useState } from 'react'
import { Flex, Tabs, TabPanels, TabPanel, IconButton, Text } from '@chakra-ui/react'
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons'

import { LandingPageSummaries } from '../landing/LandingPageSummaries'
import { TierTwoSummaries } from './TierTwoSummaries'
import { TierThreeSummaries } from './TierThreeSummaries'
import { Trans } from '@lingui/macro'

export function TieredSummaries() {
  const [tabIndex, setTabIndex] = useState(0)

  const handleBackBtn = () => {
    tabIndex === 0 ? setTabIndex(2) : setTabIndex(tabIndex - 1)
  }

  const handleFwdBtn = () => {
    tabIndex === 2 ? setTabIndex(0) : setTabIndex(tabIndex + 1)
  }

  return (
    <Flex align="center" w="100%">
      <IconButton
        borderColor="gray.900"
        bg="gray.50"
        borderWidth="1px"
        rounded="full"
        icon={<ArrowLeftIcon />}
        onClick={handleBackBtn}
      />
      <Tabs index={tabIndex} isLazy>
        <TabPanels>
          <TabPanel>
            <Text mb="2" textAlign="center" fontWeight="bold" fontSize="xl">
              <Trans>Tier 1</Trans>
            </Text>
            <LandingPageSummaries />
          </TabPanel>
          <TabPanel>
            <Text mb="2" textAlign="center" fontWeight="bold" fontSize="xl">
              <Trans>Tier 2</Trans>
            </Text>
            <TierTwoSummaries />
          </TabPanel>
          <TabPanel>
            <Text mb="2" textAlign="center" fontWeight="bold" fontSize="xl">
              <Trans>Tier 3</Trans>
            </Text>
            <TierThreeSummaries />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <IconButton
        borderColor="gray.900"
        bg="gray.50"
        borderWidth="1px"
        rounded="full"
        icon={<ArrowRightIcon />}
        onClick={handleFwdBtn}
      />
    </Flex>
  )
}
