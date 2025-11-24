import React from 'react'
import { Box, ListItem, OrderedList, Text } from '@chakra-ui/react'
import {
  Step,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from '@chakra-ui/react'
import { t, Trans } from '@lingui/macro'
import { string } from 'prop-types'

export function DmarcPhaseStepper({ dmarcPhase }) {
  const phaseTitles = { assess: t`Assess`, deploy: t`Deploy`, enforce: t`Enforce`, maintain: t`Maintain` }
  const steps = Object.keys(phaseTitles)
  const { activeStep } = useSteps({
    index: steps.indexOf(dmarcPhase),
    count: steps.length,
  })

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

  if (!dmarcSteps) {
    return (
      <Text mb={4} ml="4">
        <Trans>No DMARC Implementation Phase</Trans>
      </Text>
    )
  }

  return (
    <Box mb={4} ml="4">
      <Text fontSize="2xl" fontWeight="bold" mb="2">
        <Trans>DMARC Implementation Phase: {phaseTitles[dmarcPhase]}</Trans>
      </Text>

      <Stepper index={activeStep} mb="4" size="lg" colorScheme="orange">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
            </StepIndicator>

            <StepTitle flexShrink="0">{phaseTitles[step]}</StepTitle>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      <Box fontSize="lg">
        <Text fontWeight="bold">
          <Trans>Next Steps:</Trans>
        </Text>
        <OrderedList px="4">
          {dmarcSteps.map((step, idx) => {
            return <ListItem key={idx}>{step}</ListItem>
          })}
        </OrderedList>
      </Box>
    </Box>
  )
}

DmarcPhaseStepper.propTypes = {
  dmarcPhase: string,
}
