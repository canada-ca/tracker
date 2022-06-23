import React from 'react'
import { useQuery } from '@apollo/client'
import { WEBCHECK_ORGS } from '../graphql/queries'

import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  Heading,
  Text,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { ScanDomainButton } from '../domains/ScanDomainButton'

export default function WebCheckPage() {
  const { loading, error, data } = useQuery(WEBCHECK_ORGS, {})
  if (error) return <ErrorFallbackMessage error={error} />

  const displayTags = (tags) => {
    return (
      <Flex ml="auto">
        {tags.edges.map(({ id, severity }) => {
          return (
            <Badge
              key={id}
              mx="2"
              bg={severity.toLowerCase()}
              pt="0.5"
              px="2"
              rounded="12"
              borderWidth="1px"
              borderColor="black"
              justifySelf={{ base: 'start', md: 'end' }}
            >
              {id}
            </Badge>
          )
        })}
      </Flex>
    )
  }

  const orgList = loading ? (
    <LoadingMessage />
  ) : data.findMyWebCheckOrganizations.totalCount === 0 ? (
    <Text>
      <Trans>No vulnerable domains</Trans>
    </Text>
  ) : (
    data.findMyWebCheckOrganizations.edges.map(
      ({ id, name, acronym, verified, tags, domains }) => {
        return (
          <AccordionItem key={id}>
            <Flex w="100%">
              <AccordionButton
                width="100%"
                p="4"
                alignItems={{ base: 'flex-start', md: 'center' }}
                flexDirection={{ base: 'column', md: 'row' }}
                _hover={{ bg: 'gray.100' }}
                mb="2"
                borderWidth="1px"
                borderColor="black"
                rounded="md"
              >
                <Flex w="100%" textAlign="left">
                  <Text fontWeight="bold">
                    {name} ({acronym}){' '}
                    {verified && (
                      <CheckCircleIcon
                        color="blue.500"
                        size="icons.sm"
                        aria-label="Verified Organization"
                      />
                    )}
                  </Text>
                  {displayTags(tags)}
                </Flex>
              </AccordionButton>
            </Flex>
            {domains.edges.map(({ id, domain, lastRan, tags }) => {
              return (
                <AccordionPanel key={id}>
                  <Flex
                    borderColor="black"
                    borderWidth="1px"
                    rounded="md"
                    align="center"
                    p="4"
                    w="100%"
                  >
                    <Text fontWeight="semibold" mr="1">
                      <Trans>Domain:</Trans>
                    </Text>
                    <Text isTruncated mr="8">
                      {domain}
                    </Text>

                    <Text fontWeight="bold" mr="1">
                      <Trans>Last Scanned:</Trans>
                    </Text>
                    <Text isTruncated>{lastRan}</Text>

                    {displayTags(tags)}
                    <ScanDomainButton domainUrl={domain} ml={4} />
                  </Flex>
                </AccordionPanel>
              )
            })}
          </AccordionItem>
        )
      },
    )
  )

  return (
    <Box px="4" w="100%">
      <Heading>
        <Trans>Web Check</Trans>
      </Heading>
      <Text fontSize="xl" fontWeight="bold" mb="8">
        <Trans>Vulnerability Scan Dashboard</Trans>
      </Text>
      <Accordion allowMultiple defaultIndex={[]}>
        {orgList}
      </Accordion>
    </Box>
  )
}
