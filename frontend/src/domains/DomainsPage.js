import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Flex,
  Heading,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'

import { DomainCard } from './DomainCard'

import { ListOf } from '../components/ListOf'
import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import {
  PAGINATED_DOMAINS as FORWARD,
  GET_ALL_ORGANIZATION_DOMAINS_STATUSES_CSV,
} from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { useLazyQuery } from '@apollo/client'
import { ExportButton } from '../components/ExportButton'
import { SubdomainWarning } from './SubdomainWarning'

export default function DomainsPage() {
  const toast = useToast()
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)

  const [
    getAllOrgDomainStatuses,
    { loading: allOrgDomainStatusesLoading, _error, _data },
  ] = useLazyQuery(GET_ALL_ORGANIZATION_DOMAINS_STATUSES_CSV, {
    onError(error) {
      toast({
        title: error.message,
        description: t`An error occured when you attempted to download all domain statuses.`,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

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

  const { isOpen, onToggle } = useDisclosure()

  if (error) return <ErrorFallbackMessage error={error} />

  const orderByOptions = [
    { value: 'DOMAIN', text: t`Domain` },
    { value: 'HTTPS_STATUS', text: t`HTTPS Status` },
    { value: 'HSTS_STATUS', text: t`HSTS Status` },
    { value: 'CIPHERS_STATUS', text: t`Ciphers Status` },
    { value: 'CURVES_STATUS', text: t`Curves Status` },
    { value: 'PROTOCOLS_STATUS', text: t`Protocols Status` },
    { value: 'SPF_STATUS', text: t`SPF Status` },
    { value: 'DKIM_STATUS', text: t`DKIM Status` },
    { value: 'DMARC_STATUS', text: t`DMARC Status` },
  ]

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
      {({ id, domain, status, hasDMARCReport }, index) => (
        <ErrorBoundary
          key={`${id}:${index}`}
          FallbackComponent={ErrorFallbackMessage}
        >
          <DomainCard
            id={id}
            url={domain}
            status={status}
            hasDMARCReport={hasDMARCReport}
            mb="3"
          />
        </ErrorBoundary>
      )}
    </ListOf>
  )

  return (
    <Box w="100%" px={4}>
      <Flex
        flexDirection="row"
        align="center"
        mb="4"
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <Heading as="h1" textAlign="left" mb="4">
          <Trans>Domains</Trans>
        </Heading>

        <ExportButton
          order={{ base: 2, md: 1 }}
          ml="auto"
          mt={{ base: '4', md: 0 }}
          fileName={`Tracker_all_domains_${new Date().toLocaleDateString()}`}
          dataFunction={async () => {
            toast({
              title: t`Getting domain statuses`,
              description: t`Request successfully sent to get all domain statuses - this may take a minute.`,
              status: 'info',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
            const result = await getAllOrgDomainStatuses()
            if (result.data?.getAllOrganizationDomainStatuses === undefined) {
              toast({
                title: t`No data found`,
                description: t`No data found when retrieving all domain statuses.`,
                status: 'error',
                duration: 9000,
                isClosable: true,
                position: 'top-left',
              })

              throw t`No data found`
            }

            return result.data?.getAllOrganizationDomainStatuses
          }}
          isLoading={allOrgDomainStatusesLoading}
        />
      </Flex>

      <InfoPanel isOpen={isOpen} onToggle={onToggle}>
        <InfoBox title={t`Domain`} info={t`The domain address.`} />
        <InfoBox
          title={t`Ciphers`}
          info={t`Shows if the domain uses only ciphers that are strong or acceptable.`}
        />
        <InfoBox
          title={t`Curves`}
          info={t`Shows if the domain uses only curves that are strong or acceptable.`}
        />
        <InfoBox
          title={t`HSTS`}
          info={t`Shows if the domain meets the HSTS requirements.`}
        />
        <InfoBox
          title={t`HTTPS`}
          info={t`Shows if the domain meets the Hypertext Transfer Protocol Secure (HTTPS) requirements.`}
        />
        <InfoBox
          title={t`Protocols`}
          info={t`Shows if the domain uses acceptable protocols.`}
        />
        <InfoBox
          title={t`SPF`}
          info={t`Shows if the domain meets the Sender Policy Framework (SPF) requirements.`}
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

      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <SearchBox
          selectedDisplayLimit={domainsPerPage}
          setSelectedDisplayLimit={setDomainsPerPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
          isLoadingMore={isLoadingMore}
          orderDirection={orderDirection}
          setSearchTerm={setSearchTerm}
          setOrderField={setOrderField}
          setOrderDirection={setOrderDirection}
          resetToFirstPage={resetToFirstPage}
          orderByOptions={orderByOptions}
          placeholder={t`Search for a domain`}
        />

        <SubdomainWarning mb="4" />

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
        <InfoButton isOpen={isOpen} onToggle={onToggle} left="50%" />
      </ErrorBoundary>
    </Box>
  )
}
