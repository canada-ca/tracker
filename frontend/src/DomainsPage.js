import React, { useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
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
  Select,
  Flex,
  Stack,
  IconButton,
} from '@chakra-ui/core'
import { PAGINATED_DOMAINS as FORWARD } from './graphql/queries'
import { useUserState } from './UserState'
import { DomainCard } from './DomainCard'
import { ScanDomain } from './ScanDomain'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { RelayPaginationControls } from './RelayPaginationControls'

export default function DomainsPage() {
  const { currentUser } = useUserState()
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)

  const orderIconName = orderDirection === 'ASC' ? 'arrow-up' : 'arrow-down'

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: domainsPerPage,
    relayRoot: 'findMyDomains',
    variables: {
      orderBy: { field: orderField, direction: orderDirection },
      search: searchTerm,
    },
  })

  if (error) return <ErrorFallbackMessage error={error} />

  const domainList = loading ? (
    <LoadingMessage>
      <Trans>Domains</Trans>
    </LoadingMessage>
  ) : (
    <ListOf
      elements={nodes}
      ifEmpty={() => (
        <Text textAlign="center" fontSize="3xl" fontWeight="bold">
          <Trans>No Domains</Trans>
        </Text>
      )}
      mb="4"
    >
      {({ id, domain, lastRan, status }, index) => (
        <ErrorBoundary
          key={`${id}:${index}`}
          FallbackComponent={ErrorFallbackMessage}
        >
          <Box>
            <DomainCard url={domain} lastRan={lastRan} status={status} />
            <Divider borderColor="gray.900" />
          </Box>
        </ErrorBoundary>
      )}
    </ListOf>
  )

  return (
    <Layout>
      <Heading as="h1" mb="4" textAlign={{ base: 'center', md: 'left' }}>
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
            <Text
              fontSize="2xl"
              mb="2"
              textAlign={{ base: 'center', md: 'left' }}
            >
              <Trans>Search for any Government of Canada tracked domain:</Trans>
            </Text>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                alignItems={{ base: 'stretch', md: 'center' }}
                mb={{ base: '4', md: '8' }}
              >
                <InputGroup mb={{ base: '8px', md: '0' }} flexGrow={1}>
                  <InputLeftElement>
                    <Icon name="search" color="gray.300" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    placeholder={t`Search for a domain`}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      resetToFirstPage()
                    }}
                  />
                </InputGroup>

                <Stack isInline align="center" ml={{ md: '10%' }}>
                  <Text fontSize="md" fontWeight="bold" textAlign="center">
                    <Trans>Sort by:</Trans>
                  </Text>
                  <Select
                    width="fit-content"
                    size="md"
                    variant="filled"
                    value={orderField}
                    onChange={(e) => {
                      setOrderField(e.target.value)
                      resetToFirstPage()
                    }}
                  >
                    <option value="DOMAIN">{t`Domain`}</option>
                    <option value="LAST_RAN">{t`Last Scanned`}</option>
                    <option value="HTTPS_STATUS">{t`HTTPS Status`}</option>
                    <option value="SSL_STATUS">{t`SSL Status`}</option>
                    <option value="SPF_STATUS">{t`SPF Status`}</option>
                    <option value="DKIM_STATUS">{t`DKIM Status`}</option>
                    <option value="DMARC_STATUS">{t`DMARC Status`}</option>
                  </Select>
                  <IconButton
                    aria-label="Toggle sort direction"
                    icon={orderIconName}
                    color="primary"
                    onClick={() => {
                      const newOrderDirection =
                        orderDirection === 'ASC' ? 'DESC' : 'ASC'
                      setOrderDirection(newOrderDirection)
                      resetToFirstPage()
                    }}
                  />
                </Stack>
              </Flex>

              {domainList}

              <RelayPaginationControls
                onlyPagination={false}
                selectedDisplayLimit={domainsPerPage}
                setSelectedDisplayLimit={setDomainsPerPage}
                displayLimitOptions={[5, 10, 20, 50, 100]}
                resetToFirstPage={resetToFirstPage}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
                next={next}
                previous={previous}
                isLoadingMore={isLoadingMore}
              />
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
