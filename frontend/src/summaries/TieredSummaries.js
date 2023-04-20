import React, { useState } from 'react'
import { Flex, Tabs, TabPanels, TabPanel, IconButton, Text, Box, Tooltip } from '@chakra-ui/react'
import { ArrowLeftIcon, ArrowRightIcon, QuestionOutlineIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

import { TierOneSummaries } from './TierOneSummaries'
import { TierTwoSummaries } from './TierTwoSummaries'
import { TierThreeSummaries } from './TierThreeSummaries'
import { Trans, t } from '@lingui/macro'
import { object } from 'prop-types'
import { ABTestingWrapper } from '../app/ABTestWrapper'
import { ABTestVariant } from '../app/ABTestVariant'

export function TieredSummaries({ summaries }) {
  const [show, setShow] = useState(false)
  const { https, dmarc, webConnections, ssl, spf, dkim, dmarcPhase, web, mail } = summaries

  let hidden = null
  if (typeof summaries?.httpsIncludeHidden !== 'undefined')
    hidden = {
      https: summaries?.httpsIncludeHidden,
      dmarc: summaries?.dmarcIncludeHidden,
    }

  const [tabIndex, setTabIndex] = useState(0)

  const handleBackBtn = () => {
    tabIndex === 0 ? setTabIndex(2) : setTabIndex(tabIndex - 1)
  }

  const handleFwdBtn = () => {
    tabIndex === 2 ? setTabIndex(0) : setTabIndex(tabIndex + 1)
  }

  return (
    <Box>
      <ABTestingWrapper insiderVariantName="B">
        <ABTestVariant name="B">
          <Flex align="center" w="100%" mb="4" justifyContent="space-between">
            <IconButton
              borderColor="gray.900"
              bg="gray.50"
              borderWidth="1px"
              rounded="full"
              icon={<ArrowLeftIcon />}
              onClick={handleBackBtn}
            />
            <Flex align="center">
              <Text mr="2" textAlign="center" fontWeight="bold" fontSize="xl">
                <Trans>Tier {tabIndex + 1}</Trans>
              </Text>
              {hidden && tabIndex === 0 && (
                <Flex>
                  <IconButton
                    variant="primaryOutline"
                    onClick={() => setShow(!show)}
                    icon={show ? <ViewOffIcon /> : <ViewIcon />}
                  />
                  <Tooltip label={t`Show summaries including hidden domains.`}>
                    <QuestionOutlineIcon tabIndex={0} />
                  </Tooltip>
                </Flex>
              )}
            </Flex>
            <IconButton
              borderColor="gray.900"
              bg="gray.50"
              borderWidth="1px"
              rounded="full"
              icon={<ArrowRightIcon />}
              onClick={handleFwdBtn}
            />
          </Flex>
        </ABTestVariant>
      </ABTestingWrapper>

      <Tabs index={tabIndex} isLazy>
        <TabPanels>
          <TabPanel>
            <TierOneSummaries
              https={show && hidden ? hidden.https : https}
              dmarc={show && hidden ? hidden.dmarc : dmarc}
            />
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
