import React from 'react'
import { Box, Link, ListItem, OrderedList, Text } from '@chakra-ui/react'
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
import { useLingui } from '@lingui/react'

export function DmarcPhaseStepper({ dmarcPhase }) {
  const { i18n } = useLingui()
  const phases = {
    ASSESS: {
      title: t`Assess`,
      steps: [
        t`Identify all domains and subdomains used to send mail;`,
        t`Assess current state;`,
        t`Deploy initial DMARC records with policy of none; and`,
        t`Collect and analyze DMARC reports.`,
      ],
    },
    DEPLOY: {
      title: t`Deploy`,
      steps: [
        t`Identify all authorized senders;`,
        t`Deploy SPF records for all domains;`,
        t`Deploy DKIM records and keys for all domains and senders; and`,
        t`Monitor DMARC reports and correct misconfigurations.`,
      ],
    },
    ENFORCE: {
      title: t`Enforce`,
      steps: [
        t`Upgrade DMARC policy to quarantine (gradually increment enforcement from 25% to 100%;`,
        t`Upgrade DMARC policy to reject (gradually increment enforcement from 25% to 100%); and`,
        t`Reject all messages from non-mail domains.`,
      ],
    },
    MAINTAIN: {
      title: t`Maintain`,
      steps: [
        t`Monitor DMARC reports;`,
        t`Correct misconfigurations and update records as required; and`,
        t`Rotate DKIM keys annually.`,
      ],
    },
  }
  const steps = Object.keys(phases)
  const { activeStep } = useSteps({
    index: steps.indexOf(dmarcPhase),
    count: steps.length,
  })

  const { title: currentPhase, steps: dmarcSteps } = phases[dmarcPhase]
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
        <Trans>DMARC Implementation Phase: {currentPhase}</Trans>
      </Text>

      <Stepper index={activeStep} mb="4" size="lg" colorScheme="orange">
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
            </StepIndicator>

            <StepTitle flexShrink="0">{phases[step].title}</StepTitle>

            <StepSeparator />
          </Step>
        ))}
      </Stepper>

      <Box fontSize="lg">
        <Text fontWeight="bold">
          <Trans>Next Steps:</Trans>
        </Text>

        <OrderedList px="4" mb="2">
          {dmarcSteps.map((step, idx) => {
            return <ListItem key={idx}>{step}</ListItem>
          })}
        </OrderedList>

        <Text>
          <Trans>
            For more detailed steps, please see the{' '}
            <Link
              href={
                i18n.locale === 'fr'
                  ? 'https://www.cyber.gc.ca/fr/orientation/directives-de-mise-en-oeuvre-protection-du-domaine-de-courrier#ann1'
                  : 'https://www.cyber.gc.ca/en/guidance/implementation-guidance-email-domain-protection#anna'
              }
              isExternal
              color="blue.500"
            >
              CCCS implementation guidance
            </Link>
            .
          </Trans>
        </Text>
      </Box>
    </Box>
  )
}

DmarcPhaseStepper.propTypes = {
  dmarcPhase: string,
}
