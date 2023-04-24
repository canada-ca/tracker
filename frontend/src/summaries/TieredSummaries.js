import React, { useState } from 'react'
import {
  Flex,
  IconButton,
  Text,
  Box,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'

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

  return (
    <Box>
      <ABTestingWrapper insiderVariantName="B">
        <ABTestVariant name="B"></ABTestVariant>
      </ABTestingWrapper>

      <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
        <AccordionItem>
          <AccordionButton>
            <Text fontSize="xl">
              <Trans>Tier 1</Trans>
            </Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <Flex align="center" justify="space-between">
              <Text>
                <Trans>The minimum security requirements set for GC domains</Trans>
              </Text>
              {hidden && (
                <Tooltip label={t`Include hidden domains in summaries.`}>
                  <IconButton
                    variant="primaryOutline"
                    onClick={() => setShow(!show)}
                    icon={show ? <ViewOffIcon /> : <ViewIcon />}
                  />
                </Tooltip>
              )}
            </Flex>

            <TierOneSummaries
              https={show && hidden ? hidden.https : https}
              dmarc={show && hidden ? hidden.dmarc : dmarc}
            />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Text fontSize="xl">
              <Trans>Tier 2</Trans>
            </Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <TierTwoSummaries
              webConnections={webConnections}
              ssl={ssl}
              spf={spf}
              dkim={dkim}
              dmarcPhases={dmarcPhase}
            />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Text fontSize="xl">
              <Trans>Tier 3</Trans>
            </Text>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel>
            <TierThreeSummaries web={web} mail={mail} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  )
}

TieredSummaries.propTypes = {
  summaries: object,
}
