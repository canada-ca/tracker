import React from 'react'
import { Badge, Box, Flex, Heading, Text, Wrap, WrapItem } from '@chakra-ui/react'
import { useLingui } from '@lingui/react/macro'
import { explainFinding } from './findingExplainers'
import { node, object, string } from 'prop-types'

const confidenceColours = { suspected: 'yellow', probable: 'orange', confirmed: 'red' }

const formatTimestamp = (ts) => new Date(ts).toLocaleString('en-CA', { timeZoneName: 'short' })

function Fact({ label, children }) {
  return (
    <Box>
      <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color="gray.600">
        {label}
      </Text>
      <Text>{children}</Text>
    </Box>
  )
}

Fact.propTypes = { label: string, children: node }

export function FindingCard({
  subject,
  source,
  findingType,
  confidence,
  reasonCode,
  firstSeen,
  lastSeen,
  evidence,
  attributes,
}) {
  const { t } = useLingui()

  const confidenceLabels = {
    suspected: t`Suspected`,
    probable: t`Probable`,
    confirmed: t`Confirmed`,
  }

  const findingTypeLabels = {
    'subdomain-takeover-cname': t`Dangling CNAME`,
    'subdomain-takeover-ns': t`Lame Delegation (Sitting Duck)`,
  }

  return (
    <Box
      p="4"
      borderWidth="1px"
      borderLeftWidth="6px"
      borderLeftColor={`${confidenceColours[confidence] || 'gray'}.500`}
      borderRadius="md"
      bg="white"
      boxShadow="sm"
    >
      <Flex align="center" wrap="wrap" mb="2">
        <Heading as="h3" size="md" mr="auto" wordBreak="break-all">
          {findingTypeLabels[findingType] || findingType}
        </Heading>
        <Flex wrap="wrap" gap="2">
          <Badge variant="outline" colorScheme="gray" fontSize="sm">
            {source}
          </Badge>
          <Badge colorScheme={confidenceColours[confidence] || 'gray'} fontSize="sm">
            {confidenceLabels[confidence] || confidence}
          </Badge>
        </Flex>
      </Flex>
      <Box mb="3">{explainFinding({ subject, source, evidence, attributes })}</Box>
      <Wrap spacing="6">
        <WrapItem>
          <Fact label={t`Reason code`}>
            <Text as="span" fontFamily="mono" fontSize="sm" color="gray.600">
              {reasonCode}
            </Text>
          </Fact>
        </WrapItem>
        <WrapItem>
          <Fact label={t`First seen`}>{formatTimestamp(firstSeen)}</Fact>
        </WrapItem>
        <WrapItem>
          <Fact label={t`Last seen`}>{formatTimestamp(lastSeen)}</Fact>
        </WrapItem>
      </Wrap>
    </Box>
  )
}

FindingCard.propTypes = {
  subject: string,
  source: string,
  findingType: string,
  confidence: string,
  reasonCode: string,
  firstSeen: string,
  lastSeen: string,
  evidence: object,
  attributes: object,
}
