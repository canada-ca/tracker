import React, { useState } from 'react'
import { Flex, Tabs, TabPanels, TabPanel, IconButton, Text, Box } from '@chakra-ui/react'
import { ArrowLeftIcon, ArrowRightIcon } from '@chakra-ui/icons'

import { TierOneSummaries } from './TierOneSummaries'
import { TierTwoSummaries } from './TierTwoSummaries'
import { TierThreeSummaries } from './TierThreeSummaries'
import { Trans } from '@lingui/macro'
import { object } from 'prop-types'

export function TieredSummaries({ summaries }) {
  const { https, dmarc, webConnections, ssl, spf, dkim, dmarcPhase, web, mail } = summaries
  const [tabIndex, setTabIndex] = useState(0)

  const handleBackBtn = () => {
    tabIndex === 0 ? setTabIndex(2) : setTabIndex(tabIndex - 1)
  }

  const handleFwdBtn = () => {
    tabIndex === 2 ? setTabIndex(0) : setTabIndex(tabIndex + 1)
  }

  return (
    <Box>
      <Flex align="center" w="100%" mb="2" justifyContent="space-between">
        <IconButton
          borderColor="gray.900"
          bg="gray.50"
          borderWidth="1px"
          rounded="full"
          icon={<ArrowLeftIcon />}
          onClick={handleBackBtn}
        />
        <Text mb="2" textAlign="center" fontWeight="bold" fontSize="xl">
          <Trans>Tier {tabIndex + 1}</Trans>
        </Text>
        <IconButton
          borderColor="gray.900"
          bg="gray.50"
          borderWidth="1px"
          rounded="full"
          icon={<ArrowRightIcon />}
          onClick={handleFwdBtn}
        />
      </Flex>
      <Tabs index={tabIndex} isLazy>
        <TabPanels>
          <TabPanel>
            <TierOneSummaries https={https} dmarc={dmarc} />
          </TabPanel>
          <TabPanel>
            <TierTwoSummaries
              webConnections={webConnections}
              ssl={ssl}
              spf={spf}
              dkim={dkim}
              dmarcPhases={dmarcPhase}
            />
          </TabPanel>
          <TabPanel>
            <TierThreeSummaries web={web} mail={mail} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

TieredSummaries.propTypes = {
  summaries: object,
}
