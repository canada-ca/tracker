import React from 'react'
import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react'

import { TierOneSummaries } from './TierOneSummaries'
import { TierTwoSummaries } from './TierTwoSummaries'
import { TierThreeSummaries } from './TierThreeSummaries'
import { Trans } from '@lingui/macro'
import { object } from 'prop-types'

export function TieredSummaries({ summaries }) {
  const { https, dmarc, webConnections, ssl, spf, dkim, dmarcPhase, web, mail } = summaries

  return (
    <Box>
      <Accordion allowMultiple defaultIndex={[0]}>
        <AccordionItem>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left" fontSize="xl">
              <Trans>Tier 1: Minimum Requirements</Trans>
            </Box>
            <AccordionIcon boxSize="icons.xl" />
          </AccordionButton>
          <AccordionPanel>
            <TierOneSummaries https={https} dmarc={dmarc} />
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left" fontSize="xl">
              <Trans>Tier 2: Improved Posture</Trans>
            </Box>
            <AccordionIcon boxSize="icons.xl" />
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
            <Box as="span" flex="1" textAlign="left" fontSize="xl">
              <Trans>Tier 3: Compliance</Trans>
            </Box>
            <AccordionIcon boxSize="icons.xl" />
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
