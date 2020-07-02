import React from 'react'
import {
  Text,
  Link,
  Stack,
  Icon,
  Heading,
  useToast,
  Divider,
} from '@chakra-ui/core'
import { Layout } from './Layout'
import { Link as ReactRouterLink } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'
import { useQuery } from '@apollo/react-hooks'
import { DOMAINS } from './graphql/queries'
import { useUserState } from './UserState'
import { sanitizeUrl } from './sanitizeUrl'

export default function DomainDetails() {
  const { i18n } = useLingui()
  const { currentUser } = useUserState()
  const toast = useToast()
  const { loading, _error, data } = useQuery(DOMAINS, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  let domains = []
  if (data && data.domains.edges) {
    domains = data.domains.edges.map((e) => e.node)
  }
  console.log(domains)

  if (loading)
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )

  const genWebStatus = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 70) {
      statusIcon = <Icon name="check" color="green.300" />
    } else {
      statusIcon = <Icon name="warning" color="red.500" />
    }
    return statusIcon
  }

  const genEmailStatus = () => {
    const randNum = Math.floor(Math.random() * 100 + 1)
    let statusIcon
    if (randNum < 33) {
      statusIcon = <Icon name="check" color="green.300" />
    } else if (randNum >= 33 && randNum < 66) {
      statusIcon = <Icon name="warning-2" color="yellow.400" />
    } else {
      statusIcon = <Icon name="warning" color="red.500" />
    }
    return statusIcon
  }

  const webCategories = [
    { name: 'HTTPS', description: 'HTTPS Description' },
    { name: 'HSTS', description: 'HSTS Description' },
    { name: 'HSTS Preloaded', description: 'Preloaded Description' },
    { name: 'SSL', description: 'SSL Description' },
    { name: 'Protocols & Ciphers', description: ' P&C Description' },
    { name: 'Certificate Use', description: 'Cert Use Description' },
  ]

  const emailCategories = [
    { name: 'SPF', description: 'SPF Description' },
    { name: 'DKIM', description: 'DKIM description' },
    { name: 'DMARC', description: 'DMARC description' },
  ]

  return (
    <Layout>
      <Stack spacing={5} shouldWrapChildren>
        <Stack isInline align="center">
          <Link as={ReactRouterLink} to={'/organizations'}>
            <Icon
              alt={i18n._(t`back to organizations`)}
              color="gray.900"
              name="arrow-left"
              fontSize="2xl"
            />
          </Link>
          <Heading as="h1">Domain Scan Results</Heading>
        </Stack>

        <Stack>
          <Stack isInline align="center">
            <Text fontSize="xl" fontWeight="bold">
              URL:
            </Text>
            <Link
              // TODO: have the API enforce a scheme
              // so we don't need to guess badly here.
              fontSize="xl"
              href={`http://${sanitizeUrl(domains[0].url)}`}
              isExternal
              target="_blank"
              rel="noopener noreferrer"
            >
              {domains[0].url}
              <Icon name="external-link" mx="2px" />
            </Link>
          </Stack>
          <Stack isInline>
            <Text fontSize="xl" fontWeight="bold">
              Last Scanned:
            </Text>
            <Text fontSize="xl">{domains[0].lastRan}</Text>
          </Stack>
        </Stack>
        <Divider borderColor="gray.900" />

        <Stack>
          <Text as="u" fontSize="2xl" fontWeight="bold">
            Web Info
          </Text>
          {webCategories.map((node) => {
            return (
              <Stack key={node.name}>
                <Stack isInline align="center">
                  <Text fontWeight="bold" fontSize="lg">
                    {node.name}:
                  </Text>
                  {genWebStatus()}
                </Stack>
                <Text fontSize="md">{node.description}</Text>
                <br />
              </Stack>
            )
          })}
        </Stack>
        <Divider borderColor="gray.900" />
        <Stack>
          <Text as="u" fontSize="2xl" fontWeight="bold">
            Email Info
          </Text>
          {emailCategories.map((node) => {
            return (
              <Stack key={node.name}>
                <Stack isInline align="center">
                  <Text fontWeight="bold" fontSize="lg">
                    {node.name}:
                  </Text>
                  {genEmailStatus()}
                </Stack>
                <Text fontSize="md">{node.description}</Text>
                <br />
              </Stack>
            )
          })}
        </Stack>
      </Stack>
      <Text>*all data is mocked for demonstration purposes</Text>
    </Layout>
  )
}
