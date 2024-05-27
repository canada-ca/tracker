import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Heading, Button, Text, Link } from '@chakra-ui/react'
import { Link as RouteLink } from 'react-router-dom'

export default function ContactUsPage() {
  return (
    <Box w="100%" p="4">
      <Heading>
        <Trans>Contact the Tracker Team</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="4" />
      <Box fontSize="xl" p="4">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Read Guidance</Trans>
        </Text>
        <Text mb="4">
          <Trans>
            Read the{' '}
            <Link as={RouteLink} to="/guidance" color="blue.500">
              "Getting Started" guide and FAQ section
            </Link>{' '}
            before contacting the Tracker team. This will help you to understand the tool and its capabilities.
          </Trans>
        </Text>
      </Box>
      <Box fontSize="xl" p="4">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Government of Canada Employees</Trans>
        </Text>
        <Text mb="8">
          <Trans>
            Individuals from a departmental information technology group may contact the TBS Cyber Security mailbox for
            results interpretation and domain management.
          </Trans>
        </Text>
        <Text mb="4">
          <Trans>
            For questions and issues related to scan data, your organization's domain list, or getting help onboarding
            users, please contact TBS Cyber Security.
          </Trans>
        </Text>
        <Button
          variant="primary"
          size="lg"
          mb="2"
          as={Link}
          href={'mailto:zzTBSCybers@tbs-sct.gc.ca?subject=Tracker%20Issue%20Report'}
          isExternal={true}
        >
          <Trans>Contact Us</Trans>
        </Button>
      </Box>
      <Box fontSize="xl" p="4">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Tracker GitHub</Trans>
        </Text>
        <Text>
          <Trans>
            Report bugs and submit feature requests through our{' '}
            <Link color="blue.500" href={'https://github.com/canada-ca/tracker/issues'} isExternal={true}>
              GitHub page
            </Link>
            .
          </Trans>
        </Text>
      </Box>
    </Box>
  )
}
