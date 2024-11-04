import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Code,
  Divider,
  Flex,
  Heading,
  ListItem,
  Text,
  UnorderedList,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'

import { DomainCard } from './DomainCard'

import { ListOf } from '../components/ListOf'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import {
  GET_ALL_ORGANIZATION_DOMAINS_STATUSES_CSV,
  PAGINATED_DOMAINS as FORWARD,
  GET_TOP_25_REPORT,
} from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { useLazyQuery } from '@apollo/client'
import { ExportButton } from '../components/ExportButton'
import { AffiliationFilterSwitch } from '../components/AffiliationFilterSwitch'
import { useUserVar } from '../utilities/userState'
import { DomainListFilters } from './DomainListFilters'
import { FilterList } from './FilterList'
import withSuperAdmin from '../app/withSuperAdmin'

export default function DomainsPage() {
  const { hasAffiliation, isLoggedIn } = useUserVar()
  const toast = useToast()
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(50)
  const [isAffiliated, setIsAffiliated] = useState(hasAffiliation())
  const [filters, setFilters] = useState([])

  const [getAllOrgDomainStatuses, { loading: allOrgDomainStatusesLoading }] = useLazyQuery(
    GET_ALL_ORGANIZATION_DOMAINS_STATUSES_CSV,
    {
      variables: { filters },
      onError(error) {
        toast({
          title: error.message,
          description: t`An error occurred when you attempted to download all domain statuses.`,
          status: 'error',
          duration: 9000,
          isClosable: true,
          position: 'top-left',
        })
      },
    },
  )

  const [getTop25Report, { loading: top25ReportLoading }] = useLazyQuery(GET_TOP_25_REPORT, {
    variables: { filters },
    onError(error) {
      toast({
        title: error.message,
        description: t`An error occurred when you attempted to download all domain statuses.`,
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
    totalCount,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    recordsPerPage: domainsPerPage,
    relayRoot: 'findMyDomains',
    variables: {
      orderBy: { field: orderField, direction: orderDirection },
      search: debouncedSearchTerm,
      isAffiliated,
      filters,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
  })

  const { isOpen, onToggle } = useDisclosure()

  if (error) return <ErrorFallbackMessage error={error} />

  const orderByOptions = [
    { value: 'HTTPS_STATUS', text: t`HTTPS Status` },
    { value: 'HSTS_STATUS', text: t`HSTS Status` },
    { value: 'CERTIFICATES_STATUS', text: t`Certificates Status` },
    { value: 'CIPHERS_STATUS', text: t`Ciphers Status` },
    { value: 'CURVES_STATUS', text: t`Curves Status` },
    { value: 'PROTOCOLS_STATUS', text: t`Protocols Status` },
    { value: 'SPF_STATUS', text: t`SPF Status` },
    { value: 'DKIM_STATUS', text: t`DKIM Status` },
    { value: 'DMARC_STATUS', text: t`DMARC Status` },
  ]

  const filterTagOptions = [
    { value: `NXDOMAIN`, text: `NXDOMAIN` },
    { value: `BLOCKED`, text: t`Blocked` },
    { value: `WILDCARD_SIBLING`, text: t`Wildcard` },
    { value: `SCAN_PENDING`, text: t`Scan Pending` },
    { value: `HAS_ENTRUST_CERTIFICATE`, text: t`Entrust` },
  ]

  const StatusExportButton = withSuperAdmin(() => {
    return (
      <Flex>
        <ExportButton
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
          mr="2"
        />
        <ExportButton
          fileName={`Tracker_top_25_report_${new Date().toLocaleDateString()}`}
          dataFunction={async () => {
            toast({
              title: t`Getting top 25 report`,
              description: t`Request successfully sent to get top 25 report.`,
              status: 'info',
              duration: 9000,
              isClosable: true,
              position: 'top-left',
            })
            const result = await getTop25Report()
            if (result.data?.getTop25Reports === undefined) {
              toast({
                title: t`No data found`,
                description: t`No data found when retrieving top 25 report.`,
                status: 'error',
                duration: 9000,
                isClosable: true,
                position: 'top-left',
              })

              throw t`No data found`
            }

            return result.data?.getTop25Reports
          }}
          isLoading={top25ReportLoading}
        >
          <Trans>Export SPIN Top 25</Trans>
        </ExportButton>
      </Flex>
    )
  })

  const domainList = loading ? (
    <LoadingMessage>
      <Trans>Domains</Trans>
    </LoadingMessage>
  ) : (
    <Box>
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Domains</Trans>
          </Text>
        )}
        mb="4"
      >
        {(
          {
            id,
            domain,
            status,
            hasDMARCReport,
            archived,
            rcode,
            blocked,
            wildcardSibling,
            webScanPending,
            hasEntrustCertificate,
            userHasPermission,
            cveDetected,
          },
          index,
        ) => (
          <ErrorBoundary key={`${id}:${index}`} FallbackComponent={ErrorFallbackMessage}>
            <DomainCard
              className="domain-card"
              id={id}
              url={domain}
              status={status}
              hasDMARCReport={hasDMARCReport}
              isArchived={archived}
              rcode={rcode}
              blocked={blocked}
              wildcardSibling={wildcardSibling}
              webScanPending={webScanPending}
              hasEntrustCertificate={hasEntrustCertificate}
              userHasPermission={userHasPermission}
              cveDetected={cveDetected}
              mb="3"
            />
          </ErrorBoundary>
        )}
      </ListOf>
    </Box>
  )

  return (
    <Box w="100%" px={4}>
      <Flex flexDirection="row" justify="space-between" align="center" mb="4" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
        <Heading as="h1" textAlign="left" mb="4">
          <Trans>Domains</Trans>
        </Heading>
        <StatusExportButton />
      </Flex>

      <InfoPanel isOpen={isOpen} onToggle={onToggle}>
        <InfoBox title={t`Domain`} info={t`The domain address.`} />
        {/* Web statuses */}
        <InfoBox
          title={t`HTTPS`}
          info={t`Shows if the domain meets the Hypertext Transfer Protocol Secure (HTTPS) requirements.`}
        />
        <InfoBox title={t`HSTS`} info={t`Shows if the domain meets the HSTS requirements.`} />
        <InfoBox title={t`Certificates`} info={t`Shows if the domain has a valid SSL certificate.`} />
        <InfoBox title={t`Protocols`} info={t`Shows if the domain uses acceptable protocols.`} />
        <InfoBox title={t`Ciphers`} info={t`Shows if the domain uses only ciphers that are strong or acceptable.`} />
        <InfoBox title={t`Curves`} info={t`Shows if the domain uses only curves that are strong or acceptable.`} />
        {/* Email statuses */}
        <InfoBox title={t`SPF`} info={t`Shows if the domain meets the Sender Policy Framework (SPF) requirements.`} />
        <InfoBox
          title={t`DKIM`}
          info={t`Shows if the domain meets the DomainKeys Identified Mail (DKIM) requirements.`}
        />
        <InfoBox
          title={t`DMARC`}
          info={t`Shows if the domain meets the Message Authentication, Reporting, and Conformance (DMARC) requirements.`}
        />
        {/* Tags */}
        <InfoBox title={t`NXDOMAIN`} info={t`Tag used to show domains that have an rcode status of NXDOMAIN`} />
        <InfoBox title={t`BLOCKED`} info={t`Tag used to show domains that are possibly blocked by a firewall.`} />
        <InfoBox
          title={t`WILDCARD`}
          info={t`Tag used to show domains which may be from a wildcard subdomain (a wildcard resolver exists as a sibling).`}
        />
        <InfoBox title={t`SCAN PENDING`} info={t`Tag used to show domains that have a pending web scan.`} />
        <InfoBox title={t`SPIN Top 25`} info={t`SPIN Top 25 vulnerability detected in additional findings.`} />
        <InfoBox title={t`ENTRUST`} info={t`Tag used to show domains that have an Entrust certificate.`} />
      </InfoPanel>

      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <SearchBox
          className="search-box"
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
          orderByOptions={[{ value: 'DOMAIN', text: t`Domain` }, ...orderByOptions]}
          placeholder={t`Search for a domain`}
          onToggle={onToggle}
          searchTip={domainSearchTip}
          totalRecords={totalCount}
        />

        <Box className="filters">
          <Flex align="center" mb="2">
            <Text mr="2" fontWeight="bold" fontSize="lg">
              <Trans>Filters:</Trans>
            </Text>
            <AffiliationFilterSwitch isAffiliated={isAffiliated} setIsAffiliated={setIsAffiliated} />
            {isLoggedIn() && <Divider orientation="vertical" borderLeftColor="gray.900" height="1.5rem" mx="1" />}
            <FilterList filters={filters} setFilters={setFilters} />
          </Flex>
          <DomainListFilters
            filters={filters}
            setFilters={setFilters}
            statusOptions={orderByOptions}
            filterTagOptions={filterTagOptions}
          />
        </Box>

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
          totalRecords={totalCount}
        />
      </ErrorBoundary>
    </Box>
  )
}

export const domainSearchTip = (
  <Trans>
    <Text textAlign="center">
      <strong>
        Search Tip: Wildcard <Code>%</Code>
      </strong>
    </Text>
    <Text>
      Use <Code>%</Code> to broaden your search:
    </Text>
    <UnorderedList>
      <ListItem>
        <strong>
          Start with <Code>%</Code>
        </strong>
        : Search{' '}
        <strong>
          <Code>%example.gc.ca</Code>
        </strong>{' '}
        to find subdomains like <strong>"sub.example.gc.ca."</strong>
      </ListItem>
      <ListItem>
        <strong>
          End with <Code>%</Code>
        </strong>
        : Search{' '}
        <strong>
          <Code>example%</Code>{' '}
        </strong>
        to find domains like <strong>"example.gc.ca"</strong> or <strong>"example.canada.ca."</strong>
      </ListItem>
      <ListItem>
        <strong>Use both</strong>: Search{' '}
        <strong>
          <Code>%example%</Code>{' '}
        </strong>
        to find anything containing "example", like
        <strong>"sub.example.gc.ca"</strong> or <strong>"example.canada.ca."</strong>
      </ListItem>
    </UnorderedList>
    <Text>This helps you quickly locate related domains and subdomains.</Text>
  </Trans>
)
