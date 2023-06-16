import React, { useState } from 'react'
import {
  Flex,
  IconButton,
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
import { ABTestingWrapper, ABTestVariant } from '../app/ABTestWrapper'

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
        <ABTestVariant name="A">
          <Box>
            <Flex align="center" justify="flex-end" mb="2">
              {hidden && (
                <Tooltip label={t`Include hidden domains in summaries.`}>
                  <IconButton
                    aria-label={t`Include hidden domains in summaries.`}
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
          </Box>
        </ABTestVariant>
        <ABTestVariant name="B">
          <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
            <AccordionItem>
              <AccordionButton>
                <Box as="span" flex="1" textAlign="left" fontSize="xl">
                  <Trans>Tier 1: Minimum Requirements</Trans>
                </Box>
                <AccordionIcon boxSize="icons.xl" />
              </AccordionButton>
              <AccordionPanel>
                <Flex align="center" justify="flex-end" mb="2">
                  {hidden && (
                    <Tooltip label={t`Include hidden domains in summaries.`}>
                      <IconButton
                        aria-label={t`Include hidden domains in summaries.`}
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
        </ABTestVariant>
      </ABTestingWrapper>
    </Box>
  )
}

TieredSummaries.propTypes = {
  summaries: object,
}
