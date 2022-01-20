import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Heading, Button, Text, Link } from '@chakra-ui/react'

export default function ContactUsPage() {
  return (
    <Box w="100%" p="4">
      <Heading>
        <Trans>Contact the Tracker Team</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="4" />
      <Box fontSize="xl" p="4">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Government of Canada Employees</Trans>
        </Text>
        <Text mb="8">
          <Trans>
            Individuals from a departmental information technology group may
            contact the TBS Cyber Security mailbox for ITPIN interpretation and
            domain management.
          </Trans>
        </Text>
        <Text fontWeight="bold" mb="4">
          <Trans>
            Note that compliance data does not automatically refresh.
            Modifications to domains could take 24 hours to update.
          </Trans>
        </Text>
        <Button
          variant="primary"
          size="lg"
          mb="2"
          as={Link}
          href={
            'mailto:zzTBSCybers@tbs-sct.gc.ca?subject=Tracker%20Issue%20Report'
          }
          isExternal={true}
        >
          <Trans>Contact Us</Trans>
        </Button>
      </Box>
    </Box>
  )
}
