import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Divider,
  Flex,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { ArrowDownIcon, ArrowUpIcon, SearchIcon } from '@chakra-ui/icons'
import { ErrorBoundary } from 'react-error-boundary'

import { ScanDomain } from './ScanDomain'
import { DomainCard } from './DomainCard'

import { ListOf } from '../components/ListOf'
import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_DOMAINS as FORWARD } from '../graphql/queries'

export default function DomainsPage() {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const orderIconName =
    orderDirection === 'ASC' ? <ArrowUpIcon /> : <ArrowDownIcon />

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
    recordsPerPage: domainsPerPage,
    relayRoot: 'findMyDomains',
    variables: {
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const [infoState, changeInfoState] = useState({
    isVisible: false,
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
        <Text layerStyle="loadingMessage">
          <Trans>No Domains</Trans>
        </Text>
      )}
      mb="4"
    >
      {({ id, domain, lastRan, status, hasDMARCReport }, index) => (
        <ErrorBoundary
          key={`${id}:${index}`}
          FallbackComponent={ErrorFallbackMessage}
        >
          <Box>
            <DomainCard
              url={domain}
              lastRan={lastRan}
              status={status}
              hasDMARCReport={hasDMARCReport}
            />
            <Divider borderColor="gray.900" />
          </Box>
        </ErrorBoundary>
      )}
    </ListOf>
  )

  return (
    <Box w="100%" px={4}>
      <Stack direction="row" justify="space-between" mb="4">
        <Heading as="h1" textAlign="left">
          <Trans>Domains</Trans>
        </Heading>

        <InfoButton
          label={t`Glossary`}
          state={infoState}
          changeState={changeInfoState}
        />
      </Stack>

      <InfoPanel state={infoState}>
        <InfoBox title={t`Domain`} info={t`The domain address.`} />
        <InfoBox
          title={t`Last scanned`}
          info={t`The time the domain was last scanned by the system.`}
        />
        <InfoBox
          title={t`HTTPS`}
          info={t`Shows if the domain meets the Hypertext Transfer Protocol Secure (HTTPS) requirments.`}
        />
        <InfoBox
          title={t`Protocols & Ciphers`}
          info={t`Shows if the domain meets the Protocol & Cipher requirements.`}
        />
        <InfoBox
          title={t`SPF`}
          info={t`Shows if the domain meets the Sender Policy Framework (SPF) requiremtns.`}
        />
        <InfoBox
          title={t`DKIM`}
          info={t`Shows if the domain meets the DomainKeys Identified Mail (DKIM) requirements.`}
        />
        <InfoBox
          title={t`DMARC`}
          info={t`Shows if the domain meets the Message Authentication, Reporting, and Conformance (DMARC) requirements.`}
        />
      </InfoPanel>

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
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                alignItems={{ base: 'stretch', md: 'center' }}
                mb={{ base: '4', md: '8' }}
              >
                <Flex
                  direction="row"
                  minW={{ base: '100%', md: '50%' }}
                  alignItems="center"
                  flexGrow={1}
                  mb={2}
                >
                  <Text
                    as="label"
                    htmlFor="Search-for-field"
                    fontSize="md"
                    fontWeight="bold"
                    textAlign="center"
                    mr={2}
                  >
                    <Trans>Search: </Trans>
                  </Text>
                  <InputGroup flexGrow={1}>
                    <InputLeftElement aria-hidden="true">
                      <SearchIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      id="Search-for-field"
                      type="text"
                      placeholder={t`Search for a domain`}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        resetToFirstPage()
                      }}
                    />
                  </InputGroup>
                </Flex>

                <Stack isInline align="center" ml={{ md: '10%' }}>
                  <Text
                    as="label"
                    htmlFor="Sort-by-field"
                    fontSize="md"
                    fontWeight="bold"
                    textAlign="center"
                  >
                    <Trans>Sort by:</Trans>
                  </Text>
                  <Select
                    id="Sort-by-field"
                    data-testid="sort-select"
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
                    <option value="SSL_STATUS">{t`Protocol & Cipher Status`}</option>
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
    </Box>
  )
}
