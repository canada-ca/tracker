import React from 'react'
import { number } from 'prop-types'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
  Stack,
  Button,
  Box,
  Divider,
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
  Text,
} from '@chakra-ui/core'
import {
  REVERSE_PAGINATED_DOMAINS as BACKWARD,
  PAGINATED_DOMAINS as FORWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { DomainCard } from './DomainCard'
import { ScanDomain } from './ScanDomain'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'

export default function DomainsPage({ domainsPerPage = 10 }) {
  const { currentUser } = useUserState()
  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchBackward: BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: domainsPerPage,
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading)
    return (
      <LoadingMessage>
        <Trans>Domains</Trans>
      </LoadingMessage>
    )

  return (
    <Layout>
      <Heading as="h1" mb="4" textAlign={['center', 'left']}>
        <Trans>Domains</Trans>
      </Heading>

      <Tabs isFitted>
        <TabList mb="4">
          <Tab>
            <Trans>Search</Trans>
          </Tab>
          <Tab>
            <Trans>Scan</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Text fontSize="2xl" mb="2" textAlign={['center', 'left']}>
              <Trans>Search for any Government of Canada tracked domain:</Trans>
            </Text>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <InputGroup width="100%" mb="8px">
                <InputLeftElement>
                  <Icon name="search" color="gray.300" />
                </InputLeftElement>
                <Input type="text" placeholder={t`Search for a domain`} />
              </InputGroup>

              <ListOf
                elements={nodes}
                ifEmpty={() => <Trans>No Domains</Trans>}
                mb="4"
              >
                {({ id, domain, lastRan, status }, index) => (
                  <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                    <Box key={`${id}:${index}`}>
                      <DomainCard
                        url={domain}
                        lastRan={lastRan}
                        status={status}
                      />
                      <Divider borderColor="gray.900" />
                    </Box>
                  </ErrorBoundary>
                )}
              </ListOf>

              <Stack isInline align="center" mb="4">
                <Button
                  onClick={previous}
                  disable={!!hasPreviousPage}
                  aria-label="Previous page"
                >
                  <Trans>Previous</Trans>
                </Button>

                <Button
                  onClick={next}
                  disable={!!hasNextPage}
                  aria-label="Next page"
                >
                  <Trans>Next</Trans>
                </Button>
              </Stack>

              <Trans>
                *All data represented is mocked for demonstration purposes
              </Trans>
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ScanDomain />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}

DomainsPage.propTypes = { domainsPerPage: number }
