import React from 'react'
import PropTypes from 'prop-types'
import { ScanCard } from './ScanCard'
import { t, Trans } from '@lingui/macro'
import { ScanDetails } from './ScanDetails'
import { GuidanceTagList } from './GuidanceTagList'
import { Box, ListItem, OrderedList, Text } from '@chakra-ui/react'

const EmailGuidance = ({ emailScan, dmarcPhase = 'unknown' }) => {
  const dmarcScan = emailScan.dmarc.edges[0].node
  const spfScan = emailScan.spf.edges[0].node
  const dkimScan = emailScan.dkim.edges[0].node.results.edges[0].node

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

  return (
    <>
      <ScanCard
        description={t`Email Scan Results`}
        title={t`Results for scans of email technologies (DMARC, SPF, DKIM).`}
      >
        <Box mb={4}>
          <Text fontWeight="bold" fontSize="2xl">
            <Trans>
              DMARC Implementation Phase: {dmarcPhase.toUpperCase()}
            </Trans>
          </Text>
          {dmarcSteps && (
            <Box bg="gray.100" px="2" py="1">
              <OrderedList>{dmarcStepList}</OrderedList>
            </Box>
          )}
        </Box>

        <ScanDetails title={`DMARC`}>
          <GuidanceTagList
            positiveTags={dmarcScan.positiveGuidanceTags.edges}
            neutralTags={dmarcScan.neutralGuidanceTags.edges}
            negativeTags={dmarcScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={`SPF`}>
          <GuidanceTagList
            positiveTags={spfScan.positiveGuidanceTags.edges}
            neutralTags={spfScan.neutralGuidanceTags.edges}
            negativeTags={spfScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
        <ScanDetails title={`DKIM`}>
          <GuidanceTagList
            positiveTags={dkimScan.positiveGuidanceTags.edges}
            neutralTags={dkimScan.neutralGuidanceTags.edges}
            negativeTags={dkimScan.negativeGuidanceTags.edges}
          />
        </ScanDetails>
      </ScanCard>
    </>
  )
}

EmailGuidance.propTypes = {
  emailScan: PropTypes.object.isRequired,
  dmarcPhase: PropTypes.string,
}

export default EmailGuidance
