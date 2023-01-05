import React from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  ListItem,
  OrderedList,
  Text,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { object, string } from 'prop-types'
import { NumberedStatusIcon } from '../components/NumberedStatusIcon'
import { GuidanceTagList } from './GuidanceTagList'
import { StatusIcon } from '../components/StatusIcon'
import { InfoIcon } from '@chakra-ui/icons'
import { GuidanceSummaryCategories } from './GuidanceSummaryCategories'

export function EmailGuidance({ dnsResults, dmarcPhase }) {
  let dmarcSteps
  switch (dmarcPhase) {
    case 'assess':
      dmarcSteps = [
        t`Identify all domains and subdomains used to send mail;`,
        t`Assess current state;`,
        t`Deploy initial DMARC records with policy of none; and`,
        t`Collect and analyze DMARC reports.`,
      ]
      break
    case 'deploy':
      dmarcSteps = [
        t`Identify all authorized senders;`,
        t`Deploy SPF records for all domains;`,
        t`Deploy DKIM records and keys for all domains and senders; and`,
        t`Monitor DMARC reports and correct misconfigurations.`,
      ]
      break
    case 'enforce':
      dmarcSteps = [
        t`Upgrade DMARC policy to quarantine (gradually increment enforcement from 25% to 100%;`,
        t`Upgrade DMARC policy to reject (gradually increment enforcement from 25% to 100%); and`,
        t`Reject all messages from non-mail domains.`,
      ]
      break
    case 'maintain':
      dmarcSteps = [
        t`Monitor DMARC reports;`,
        t`Correct misconfigurations and update records as required; and`,
        t`Rotate DKIM keys annually.`,
      ]
      break
    default:
      dmarcSteps = undefined
      break
  }

  const dmarcStepList = !dmarcSteps
    ? undefined
    : dmarcSteps.map((step, idx) => {
        return <ListItem key={idx}>{step}</ListItem>
      })

  const { dkim, dmarc, spf } = dnsResults
  const emailKeys = ['spf', 'dkim', 'dmarc']
  let negativeDkimCount = 0
  let emailPassCount = 0
  let emailInfoCount = 0
  let emailFailCount = 0
  emailKeys.forEach((key) => {
    if (key === 'dkim') {
      dnsResults.dkim.selectors.forEach(({ positiveTags, neutralTags, negativeTags }) => {
        emailPassCount += positiveTags.length
        emailInfoCount += neutralTags.length
        emailFailCount += negativeTags.length
        negativeDkimCount += negativeTags.length
      })
    } else {
      const { positiveTags, neutralTags, negativeTags } = dnsResults[key]
      emailPassCount += positiveTags.length
      emailInfoCount += neutralTags.length
      emailFailCount += negativeTags.length
    }
  })

  const emailSummary = (
    <AccordionItem>
      <Flex align="center" as={AccordionButton}>
        <Text fontSize="2xl">
          <Trans>DNS Result Summary</Trans>
          <AccordionIcon boxSize="icons.xl" />
        </Text>
        <GuidanceSummaryCategories
          passCount={emailPassCount}
          infoCount={emailInfoCount}
          failCount={emailFailCount}
          mr="1"
        />
      </Flex>
      <AccordionPanel>
        {emailKeys.map((key, idx) => {
          let passCount = 0
          let infoCount = 0
          let failCount = 0

          if (key === 'dkim') {
            dnsResults.dkim.selectors.forEach(({ positiveTags, neutralTags, negativeTags }) => {
              passCount += positiveTags.length
              infoCount += neutralTags.length
              failCount += negativeTags.length
            })
          } else {
            const { positiveTags, neutralTags, negativeTags } = dnsResults[key]
            passCount = positiveTags.length
            infoCount = neutralTags.length
            failCount = negativeTags.length
          }
          return (
            <Flex
              key={idx}
              align="center"
              py="1"
              borderTopColor={idx === 0 ? 'gray.300' : ''}
              borderTopWidth={idx === 0 ? '1px' : ''}
              borderBottomWidth="1px"
              borderBottomColor="gray.300"
            >
              <Text fontSize="xl" pl="2">
                {key.toUpperCase()}
              </Text>
              <GuidanceSummaryCategories
                passCount={passCount}
                infoCount={infoCount}
                failCount={failCount}
                mr="2.25rem"
              />
            </Flex>
          )
        })}
      </AccordionPanel>
    </AccordionItem>
  )
  return (
    <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
      {emailSummary}
      <Box mb={4} ml="4">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>DMARC Implementation Phase: {dmarcPhase.toUpperCase()}</Trans>
        </Text>
        {dmarcSteps && (
          <Box px="2" py="1">
            <OrderedList>{dmarcStepList}</OrderedList>
          </Box>
        )}
      </Box>
      <AccordionItem>
        <Flex as={AccordionButton}>
          {spf.negativeTags.length > 0 ? (
            <NumberedStatusIcon number={spf.negativeTags.length} status="FAIL" />
          ) : (
            <StatusIcon boxSize="icons.lg" status="PASS" />
          )}
          <Text fontSize="2xl" ml="2">
            SPF
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          <Box px="2">
            <Flex mb="1" px="2">
              <Text mr="1" minW="7%">
                <Trans>Record:</Trans>
              </Text>
              {spf.record}
            </Flex>
            <Flex mb="1" px="2" bg="gray.200">
              <Text mr="1" minW="7%">
                <Trans>Lookups:</Trans>
              </Text>
              {spf.lookups}
            </Flex>
            <Flex mb="1" px="2">
              <Text mr="1" minW="7%">
                <Trans>Default:</Trans>
              </Text>
              {spf.spfDefault}
            </Flex>
          </Box>
          <GuidanceTagList
            positiveTags={spf.positiveTags}
            neutralTags={spf.neutralTags}
            negativeTags={spf.negativeTags}
          />
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <Flex as={AccordionButton}>
          {negativeDkimCount > 0 ? (
            <NumberedStatusIcon number={negativeDkimCount} status="FAIL" />
          ) : dkim.selectors.length < 1 ? (
            <StatusIcon boxSize="icons.lg" status="FAIL" />
          ) : (
            <StatusIcon boxSize="icons.lg" status="PASS" />
          )}
          <Text fontSize="2xl" ml="2">
            DKIM
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {dkim.selectors.length > 0 ? (
            dkim.selectors.map(({ selector, record, keyLength, keyType, positiveTags, neutralTags, negativeTags }) => {
              return (
                <>
                  <Text fontWeight="bold" fontSize="xl">
                    {selector}
                  </Text>
                  <Box px="2">
                    <Flex mb="1" px="2">
                      <Text mr="1" minW="7%">
                        <Trans>Record:</Trans>
                      </Text>
                      <Text isTruncated>{record}</Text>
                    </Flex>
                    <Flex mb="1" px="2" bg="gray.200">
                      <Text mr="1" minW="7%">
                        <Trans>Key type:</Trans>
                      </Text>
                      {keyType}
                    </Flex>{' '}
                    <Flex mb="1" px="2">
                      <Text mr="1" minW="7%">
                        <Trans>Key length:</Trans>
                      </Text>
                      {keyLength}
                    </Flex>
                  </Box>
                  <GuidanceTagList positiveTags={positiveTags} neutralTags={neutralTags} negativeTags={negativeTags} />
                </>
              )
            })
          ) : (
            <Flex px="2" py="1" bg="infoMuted" borderWidth="1px" borderColor="info" rounded="md" align="center">
              <InfoIcon color="info" mr="2" />
              <Text fontWeight="bold">
                <Trans>
                  No DKIM selectors are currently attached to this domain. Please contact an admin of an affiliated
                  organization to add selectors.
                </Trans>
              </Text>
            </Flex>
          )}
        </AccordionPanel>
      </AccordionItem>{' '}
      <AccordionItem>
        <Flex as={AccordionButton}>
          {dmarc.negativeTags.length > 0 ? (
            <NumberedStatusIcon number={dmarc.negativeTags.length} status="FAIL" />
          ) : (
            <StatusIcon boxSize="icons.lg" status="PASS" />
          )}
          <Text fontSize="2xl" ml="2">
            DMARC
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          <Box px="2">
            <Flex mb="1" px="2">
              <Text mr="1" minW="7%">
                <Trans>Record:</Trans>
              </Text>
              {dmarc.record}
            </Flex>
            <Flex mb="1" bg="gray.200" px="2">
              <Text mr="1" minW="7%">
                <Trans>p:</Trans>
              </Text>
              {dmarc.pPolicy}
            </Flex>
            <Flex mb="1" px="2">
              <Text mr="1" minW="7%">
                <Trans>sp:</Trans>
              </Text>
              {dmarc.spPolicy}
            </Flex>
            <Flex mb="1" bg="gray.200" px="2">
              <Text mr="1" minW="7%">
                <Trans>pct:</Trans>
              </Text>
              {dmarc.pct}
            </Flex>
          </Box>
          <GuidanceTagList
            positiveTags={dmarc.positiveTags}
            neutralTags={dmarc.neutralTags}
            negativeTags={dmarc.negativeTags}
          />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

EmailGuidance.propTypes = {
  dnsResults: object,
  dmarcPhase: string,
}
