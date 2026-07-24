import React from 'react'
import { AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Badge, Box, Flex, Text } from '@chakra-ui/react'
import { object } from 'prop-types'
import { Trans } from '@lingui/react/macro'
import withSuperAdmin from '../app/withSuperAdmin'

function PqcResults({ pqcResult }) {
  if (!pqcResult) return null

  const { supportsPqKeyExchange, supportedPqGroups, tls13Supported, scanStatus, status, error, buildRefs } = pqcResult

  const sslyzeCommit = buildRefs?.sslyzeCommit?.slice(0, 8)
  const nasslCommit = buildRefs?.nasslCommit?.slice(0, 8)

  const rowProps = {
    align: 'center',
    borderBottomWidth: '1px',
    borderBottomColor: 'gray.300',
    py: '1',
  }

  let summary
  if (error || status !== 'COMPLETED') {
    summary = (
      <Badge colorScheme="gray" fontSize="md">
        <Trans>Not scanned</Trans>
      </Badge>
    )
  } else if (supportsPqKeyExchange) {
    summary = (
      <Badge colorScheme="green" fontSize="md">
        <Trans>Supported</Trans>
      </Badge>
    )
  } else {
    summary = (
      <Badge colorScheme="red" fontSize="md">
        <Trans>Not supported</Trans>
      </Badge>
    )
  }

  return (
    <AccordionItem>
      <Flex align="center" as={AccordionButton}>
        <Text fontSize="2xl" mr="2">
          <Trans>Post-Quantum Key Exchange</Trans>
        </Text>
        <Badge colorScheme="purple" fontSize="md" mr="auto">
          <Trans>Experimental</Trans>
        </Badge>
        {summary}
        <AccordionIcon boxSize="icons.xl" />
      </Flex>
      <AccordionPanel>
        <Text mb="2">
          <Trans>
            Experimental result from an unreleased version of SSLyze. This does not affect compliance scoring and is
            visible to super admins only.
          </Trans>
        </Text>

        <Flex {...rowProps}>
          <Text mr="auto">
            <Trans>Supports post-quantum key exchange</Trans>
          </Text>
          <Text>{supportsPqKeyExchange ? <Trans>Yes</Trans> : <Trans>No</Trans>}</Text>
        </Flex>

        <Flex {...rowProps}>
          <Text mr="auto">
            <Trans>TLS 1.3 supported</Trans>
          </Text>
          <Text>{tls13Supported ? <Trans>Yes</Trans> : <Trans>No</Trans>}</Text>
        </Flex>

        <Flex {...rowProps}>
          <Text mr="auto">
            <Trans>Negotiated groups</Trans>
          </Text>
          <Text>{supportedPqGroups?.length ? supportedPqGroups.join(', ') : <Trans>None</Trans>}</Text>
        </Flex>

        {(error || scanStatus !== 'COMPLETED') && (
          <Flex {...rowProps}>
            <Text mr="auto">
              <Trans>Error</Trans>
            </Text>
            <Text>{error || scanStatus}</Text>
          </Flex>
        )}

        {buildRefs && (
          <Box mt="2">
            <Text fontSize="sm" color="gray.600">
              <Trans>
                Built from sslyze {sslyzeCommit} and nassl {nasslCommit}
              </Trans>
            </Text>
          </Box>
        )}
      </AccordionPanel>
    </AccordionItem>
  )
}

PqcResults.propTypes = {
  pqcResult: object,
}

export const WebPqcResults = withSuperAdmin(PqcResults)
