import React from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Flex,
  ListItem,
  OrderedList,
  Text,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { object, string } from 'prop-types'
import { GuidanceTagList } from './GuidanceTagList'
import { StatusIcon } from '../components/StatusIcon'
import { GuidanceSummaryCategories } from './GuidanceSummaryCategories'
import { ABTestWrapper, ABTestVariant } from '../app/ABTestWrapper'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'

export function EmailGuidance({ dnsResults, dmarcPhase, status, mxRecordDiff }) {
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

  const formatTimestamp = (ts) => {
    const date = new Date(ts)
    return date.toLocaleString('en-CA', {
      timeZoneName: 'short',
    })
  }

  const dmarcStepList = !dmarcSteps
    ? undefined
    : dmarcSteps.map((step, idx) => {
        return <ListItem key={idx}>{step}</ListItem>
      })

  const { dkim, dmarc, spf, timestamp, mxRecords, nsRecords, cnameRecord } = dnsResults
  const emailKeys = ['spf', 'dkim', 'dmarc']
  let emailPassCount = 0
  let emailInfoCount = 0
  let emailFailCount = 0
  emailKeys.forEach((key) => {
    if (key === 'dkim') {
      dnsResults.dkim.selectors.forEach(({ positiveTags, neutralTags, negativeTags }) => {
        emailPassCount += positiveTags.length
        emailInfoCount += neutralTags.length
        emailFailCount += negativeTags.length
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
        <Text fontSize="2xl" mr="auto">
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
            passCount += dnsResults.dkim.positiveTags.length
            infoCount += dnsResults.dkim.neutralTags.length
            failCount += dnsResults.dkim.negativeTags.length
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
              <Text fontSize="xl" pl="2" mr="auto">
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
    <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5]} w="100%">
      <Text fontSize="lg">
        <Trans>
          <b>Last Scanned:</b> {formatTimestamp(timestamp)}
        </Trans>
      </Text>
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
          <StatusIcon boxSize="icons.lg" status={status.spf} />
          <Text fontSize="2xl" ml="2">
            SPF
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {spf.record && (
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
          )}
          <GuidanceTagList
            positiveTags={spf.positiveTags}
            neutralTags={spf.neutralTags}
            negativeTags={spf.negativeTags}
          />
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <Flex as={AccordionButton}>
          <StatusIcon boxSize="icons.lg" status={status.dkim} />
          <Text fontSize="2xl" ml="2">
            DKIM
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {dkim.selectors.length > 0 ? (
            dkim.selectors.map(
              ({ selector, record, keyLength, keyType, positiveTags, neutralTags, negativeTags }, idx) => {
                return (
                  <>
                    <Text fontWeight="bold" fontSize="xl">
                      Selector: {selector}
                    </Text>
                    {record && (
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
                    )}
                    <GuidanceTagList
                      positiveTags={positiveTags}
                      neutralTags={neutralTags}
                      negativeTags={negativeTags}
                    />
                    {idx < dkim.selectors.length && <Divider py="1" borderBottomColor="gray.900" />}
                  </>
                )
              },
            )
          ) : (
            <GuidanceTagList
              positiveTags={dkim.positiveTags}
              neutralTags={dkim.neutralTags}
              negativeTags={dkim.negativeTags}
            />
          )}
        </AccordionPanel>
      </AccordionItem>
      <AccordionItem>
        <Flex as={AccordionButton}>
          <StatusIcon boxSize="icons.lg" status={status.dmarc} />
          <Text fontSize="2xl" ml="2">
            DMARC
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          {dmarc.record && (
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
          )}
          <GuidanceTagList
            positiveTags={dmarc.positiveTags}
            neutralTags={dmarc.neutralTags}
            negativeTags={dmarc.negativeTags}
          />
        </AccordionPanel>
      </AccordionItem>

      <AccordionItem>
        <Flex as={AccordionButton}>
          <Text fontSize="2xl" ml="2">
            DNS
          </Text>
          <AccordionIcon boxSize="icons.xl" />
        </Flex>
        <AccordionPanel>
          <Box>
            <Flex>
              <Text mr="1" minW="7%" ml="2">
                <Trans>CNAME:</Trans>
              </Text>
              {cnameRecord ? cnameRecord : t`None`}
            </Flex>
          </Box>
        </AccordionPanel>
        <AccordionPanel>
          <AccordionItem>
            <Flex>
              <Text fontSize="2xl" ml="2">
                <Trans>Mail Servers (MX)</Trans>
              </Text>
            </Flex>

            <Text ml="2">
              <Trans>Latest Scan:</Trans>
            </Text>
            {mxRecords.hosts.map(({ preference, hostname, addresses }, idx) => {
              return (
                <Flex key={idx} px="2">
                  <Text fontSize="lg" w="50%">
                    <Trans>
                      <b>Hostname:</b> {hostname}
                    </Trans>
                  </Text>
                  <Text fontSize="lg" w="40%">
                    <Trans>
                      <b>IPs:</b> {addresses.join(', ')}
                    </Trans>
                  </Text>
                  <Text fontSize="lg" w="10%" ml="auto">
                    <Trans>
                      <b>Preference:</b> {preference}
                    </Trans>
                  </Text>
                </Flex>
              )
            })}
            {mxRecords.warnings?.length > 0 && (
              <Box px="2" py="2" rounded="md" mb="4">
                <Text fontWeight="bold" fontSize="lg">
                  <Trans>Warnings:</Trans>
                </Text>
                {mxRecords.warnings.map((warning, idx) => {
                  const warningTranslated =
                    warning.toLowerCase() === 'no mx records found. is the domain parked?'
                      ? t`No MX records found. Is the domain parked?`
                      : warning
                  return (
                    <Box key={idx} px="2">
                      <Text fontSize="lg">
                        <b>{idx + 1}.</b> {warningTranslated}
                      </Text>
                    </Box>
                  )
                })}
              </Box>
            )}
            {mxRecords.error && (
              <Box px="2" py="2" rounded="md" mb="4">
                <Text fontSize="lg">
                  <Trans>
                    <b>Error:</b> {mxRecords.error}
                  </Trans>
                </Text>
              </Box>
            )}
            {mxRecordDiff.edges.length > 1 && (
              <ABTestWrapper>
                <ABTestVariant name="B">
                  <Text fontSize="xl" fontWeight="bold">
                    <Trans>Changes:</Trans>
                  </Text>
                  {mxRecordDiff.edges.map(({ node }, idx) => {
                    if (idx !== mxRecordDiff.edges.length - 1) {
                      const nextNode = mxRecordDiff.edges[idx + 1].node
                      return (
                        <ReactDiffViewer
                          key={idx}
                          newValue={node.mxRecords.hosts}
                          oldValue={nextNode.mxRecords.hosts}
                          rightTitle={node.timestamp}
                          leftTitle={nextNode.timestamp}
                          splitView={true}
                          compareMethod={DiffMethod.JSON}
                          hideLineNumbers={true}
                          showDiffOnly={true}
                        />
                      )
                    }
                  })}
                </ABTestVariant>
              </ABTestWrapper>
            )}
          </AccordionItem>
        </AccordionPanel>
        <AccordionPanel>
          <AccordionItem>
            <Flex>
              <Text fontSize="2xl" ml="2">
                <Trans>Name Servers (NS)</Trans>
              </Text>
            </Flex>

            {nsRecords.hostnames.map((hostname, idx) => {
              return (
                <Flex key={idx} px="2">
                  <Text fontSize="lg" w="50%">
                    <Trans>
                      <b>Hostname:</b> {hostname}
                    </Trans>
                  </Text>
                </Flex>
              )
            })}
            {nsRecords.warnings?.length > 0 && (
              <Box px="2" py="2" rounded="md" mb="1">
                <Text fontWeight="bold" fontSize="lg">
                  <Trans>Warnings:</Trans>
                </Text>
                {nsRecords.warnings.map((warning, idx) => {
                  return (
                    <Box key={idx} px="2">
                      <Text fontSize="lg">
                        <b>{idx + 1}.</b> {warning}
                      </Text>
                    </Box>
                  )
                })}
              </Box>
            )}
            {nsRecords.error && (
              <Box px="2" py="2" rounded="md" mb="4">
                <Text fontSize="lg">
                  <Trans>
                    <b>Error:</b> {nsRecords.error}
                  </Trans>
                </Text>
              </Box>
            )}
          </AccordionItem>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

EmailGuidance.propTypes = {
  dnsResults: object,
  dmarcPhase: string,
  status: object,
  mxRecordDiff: object,
}
