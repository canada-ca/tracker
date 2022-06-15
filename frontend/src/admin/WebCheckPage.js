import React from 'react'
import { useQuery } from '@apollo/client'
import { WEBCHECK_ORGS } from '../graphql/queries'

import { Badge, Box, Divider, Flex, Heading, Text } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

export default function WebCheckPage() {
  const { loading, error, data } = useQuery(WEBCHECK_ORGS, {
    variables: { first: 100 },
  })
  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Box>
      <Heading>
        <Trans>Web Check</Trans>
      </Heading>
      <Text fontSize="xl" fontWeight="bold">
        <Trans>Vulnerability Scan Dahsboard</Trans>
      </Text>
      <Divider borderBottomColor="gray.900" mb="8" />
      {data.findMyOrganizations.edges.map(({ node }, idx) => {
        return (
          <Box key={idx}>
            <Flex>
              <Text fontWeight="bold">{node.name}</Text>
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
            {node.domains.edges.map(({ node }, idx) => {
              return (
                <Flex key={idx} ml="8">
                  <Text fontWeight="bold">{node.domain}</Text>
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
              )
            })}
            <Divider borderBottomColor="gray.900" mb="8" />
          </Box>
        )
      })}
      <Text></Text>
    </Box>
  )
}
