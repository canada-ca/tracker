import React from 'react'
import { Trans } from '@lingui/macro'
import { Box, Divider, Heading, Button, Text, Link } from '@chakra-ui/react'

export default function ContactUsPage() {
  return (
    <Box w="100%" p="4">
      <Heading>
        <Trans>Contact the Tracker Team</Trans>
      </Heading>
      <Divider borderBottomColor="gray.900" mb="2" />
      <Box fontSize="xl">
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>General Public</Trans>
        </Text>
        <Text mb="2">
          <Trans>
            Individuals with questions about the accuracy of their domain’s
            compliance data may contact the TBS Cyber Security mailbox.
          </Trans>
        </Text>
        <Text fontWeight="bold" fontSize="2xl">
          <Trans>Government of Canada Employees</Trans>
        </Text>
        <Text mb="2">
          <Trans>
            Individuals from a departmental information technology group may
            contact the TBS Cyber Security mailbox for interpretations of this
            ITPIN.
          </Trans>
        </Text>
        <Text fontWeight="bold" mb="2">
          <Trans>
            Note that compliance data does not automatically refresh.
            Modifications to domains could take 24 hours to update.
          </Trans>
        </Text>
      </Box>
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
  )
}
