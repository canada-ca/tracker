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

export default function WebCheckPage() {
  const { loading, error, data } = useQuery(WEBCHECK_ORGS, {})
  if (error) return <ErrorFallbackMessage error={error} />

  const orgList = loading ? (
    <LoadingMessage />
  ) : data.findMyWebCheckOrganizations.totalCount === 0 ? (
    <Text>
      <Trans>No vulnerable domains</Trans>
    </Text>
  ) : (
    data.findMyWebCheckOrganizations.edges.map((node) => {
      return (
        <AccordionItem key={node.id}>
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
                  {node.name} ({node.acronym})
                </Text>
                <Flex ml="auto">
                  {node.tags.edges.map(({ id, severity }) => {
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
              </Flex>
            </AccordionButton>
          </Flex>
          {node.domains.edges.map((node, idx) => {
            return (
              <AccordionPanel key={idx}>
                <Flex
                  borderColor="black"
                  borderWidth="1px"
                  rounded="md"
                  align="center"
                  p="2"
                  w="100%"
                >
                  <Text fontWeight="bold">{node.domain}</Text>
                  <Flex ml="auto">
                    {node.tags.edges.map(({ id, severity }) => {
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
                </Flex>
              </AccordionPanel>
            )
          })}
        </AccordionItem>
      )
    })
  )

  return (
    <Box px="4" w="100%">
      <Heading>
        <Trans>Web Check</Trans>
      </Heading>
      <Text fontSize="xl" fontWeight="bold" mb="8">
        <Trans>Vulnerability Scan Dashboard</Trans>
      </Text>
      <Accordion defaultIndex={[]}>{orgList}</Accordion>
    </Box>
  )
}
