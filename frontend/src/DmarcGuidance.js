import React from 'react'
import { Box, SimpleGrid, Text, Stack, Button } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export function DmarcGuidance() {
  return (
    <Box mt="100px">
      <Text fontSize="2xl" fontWeight="bold" textAlign="center">
        Guidance
      </Text>
      <SimpleGrid
        columns={{ sm: 1, md: 1, lg: 3, xl: 3 }}
        spacing="100px"
        spacingY="50px"
        textAlign="center"
        mt="40px"
        mb="100px"
      >
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>SPF Check Failed</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              The receiving server found that the sending IP address was not
              authorized to send mail on behalf of the domain.
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>SPF Domain Alignment Failed</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              The receiving server found that the domains used in the "envelope
              from" and "header from" email addresses did not match.
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>DKIM Check Failed</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              The receiving server found that the message hadno DKIM signature,
              or that verification of the signature failed.
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>DKIM Domain Alignment Failed</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              The receiving server found that the domains usedin the DKIM header
              and the "header from" email address did not match.
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>DMARC Policy Applied</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              The DMARC policy (i.e. none, quarantine, orreject) that was
              applied to messages which failured DMARC (i.e. failed both SPF and
              DKIM).
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
        <Stack>
          <Text fontSize="lg" fontWeight="semibold">
            <Trans>Messages Subject to DMARC Policy</Trans>
          </Text>
          <Text fontSize="md" mt="10px">
            <Trans>
              Received messages failed both SPF and DKIM, and therefore failed
              DMARC. The DMARC policy specified for the domain was applied to
              these messages.
            </Trans>
          </Text>
          <Button variantColor="teal" variant="outline" mt="20px">
            <Trans>Guidance</Trans>
          </Button>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}
