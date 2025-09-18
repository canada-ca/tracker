import React, { useState, useCallback } from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Flex, Text, useDisclosure } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { array, bool, string } from 'prop-types'

import { DomainCard } from '../domains/DomainCard'
import { ListOf } from '../components/ListOf'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import {
  PAGINATED_ORG_DOMAINS as FORWARD,
  GET_ORGANIZATION_DOMAINS_STATUSES_CSV,
  MY_TRACKER_DOMAINS,
} from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { useLazyQuery } from '@apollo/client'
import { ExportButton } from '../components/ExportButton'
import { DomainListFilters } from '../domains/DomainListFilters'
import { FilterList } from '../domains/FilterList'
import { domainSearchTip } from '../domains/DomainsPage'
import useSearchParam from '../utilities/useSearchParam'

export function OrganizationDomains({
  orgSlug,
  orgName,
  userHasPermission,
  availableTags = [],
  negativeFindings = [],
}) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(50)

  const { searchValue: filters, setSearchParams: setFilters } = useSearchParam({
    name: 'domain-filters',
    defaultValue: [{ filterCategory: 'HTTPS_STATUS', comparison: 'NOT_EQUAL', filterValue: 'INFO' }],
  })

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const queryVariables =
    orgSlug === 'my-tracker'
      ? {
          orderBy: { field: orderField, direction: orderDirection },
          search: debouncedSearchTerm,
        }
      : {
          slug: orgSlug,
          orderBy: { field: orderField, direction: orderDirection },
          search: debouncedSearchTerm,
          filters,
        }

  const {
    loading,
    isLoadingMore,
    error,
    nodes,
    totalCount,
    next,
    previous,
    resetToFirstPage,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: orgSlug === 'my-tracker' ? MY_TRACKER_DOMAINS : FORWARD,
    recordsPerPage: domainsPerPage,
    relayRoot: orgSlug === 'my-tracker' ? 'findMyTracker.domains' : 'findOrganizationBySlug.domains',
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    errorPolicy: 'ignore',
  })

  const [getOrgDomainStatuses, { loading: orgDomainStatusesLoading, _error, _data }] = useLazyQuery(
    GET_ORGANIZATION_DOMAINS_STATUSES_CSV,
    {
      variables: { orgSlug, filters },
      fetchPolicy: 'no-cache',
    },
  )

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
    ...availableTags.map(({ tagId, label }) => {
      return { value: tagId, text: label.toUpperCase() }
    }),
    { value: `NXDOMAIN`, text: `NXDOMAIN` },
    { value: `BLOCKED`, text: t`Blocked` },
    { value: `WILDCARD_SIBLING`, text: t`Wildcard Sibling` },
    { value: `WILDCARD_ENTRY`, text: t`Wildcard Entry` },
    { value: `SCAN_PENDING`, text: t`Scan Pending` },
    { value: `ARCHIVED`, text: t`Archived` },
    { value: `CVE_DETECTED`, text: t`SPIN Top 25` },
  ]

  const assetStateOptions = [
    { value: t`APPROVED`, text: t`Approved` },
    { value: t`DEPENDENCY`, text: t`Dependency` },
    { value: t`MONITOR_ONLY`, text: t`Monitor Only` },
    { value: t`CANDIDATE`, text: t`Candidate` },
    { value: t`REQUIRES_INVESTIGATION`, text: t`Requires Investigation` },
  ]

  const guidanceTagOptions = negativeFindings?.map(({ tagId, tagName }) => {
    const getTagCategoryFromId = (id) => {
      return id.split(/[0-9]/)[0].toUpperCase()
    }
    return { value: tagId, text: `${getTagCategoryFromId(tagId)}: ${tagName}` }
  })

  const domainList = loading ? (
    <LoadingMessage>
      <Trans>Domains</Trans>
    </LoadingMessage>
  ) : (
    <Box>
      {orgSlug !== 'my-tracker' && (
        <DomainListFilters
          className="domain-filters"
          filters={filters}
          setFilters={setFilters}
          resetToFirstPage={resetToFirstPage}
          statusOptions={orderByOptions}
          filterTagOptions={filterTagOptions}
          assetStateOptions={assetStateOptions}
          guidanceTagOptions={guidanceTagOptions}
        />
      )}
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
            claimTags,
            assetState,
            archived,
            rcode,
            blocked,
            wildcardSibling,
            wildcardEntry,
            webScanPending,
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
              tags={claimTags}
              assetState={assetState}
              rcode={rcode}
              isArchived={archived}
              blocked={blocked}
              wildcardSibling={wildcardSibling}
              wildcardEntry={wildcardEntry}
              webScanPending={webScanPending}
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
    <Box>
      {userHasPermission && (
        <ExportButton
          ml="auto"
          my="2"
          mt={{ base: '4', md: 0 }}
          fileName={`${orgName}_${new Date().toLocaleDateString()}_Tracker`}
          dataFunction={async () => {
            const result = await getOrgDomainStatuses()
            return result.data?.findOrganizationBySlug?.toCsv
          }}
          isLoading={orgDomainStatusesLoading}
        />
      )}
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
        <InfoBox title={t`NEW`} info={t`Tag used to show domains as new to the system.`} />
        <InfoBox title={t`PROD`} info={t`Tag used to show domains as a production environment.`} />
        <InfoBox title={t`STAGING`} info={t`Tag used to show domains as a staging environment.`} />
        <InfoBox title={t`TEST`} info={t`Tag used to show domains as a test environment.`} />
        <InfoBox title={t`WEB`} info={t`Tag used to show domains as web-hosting.`} />
        <InfoBox title={t`INACTIVE`} info={t`Tag used to show domains that are not active.`} />
        <InfoBox title={`NXDOMAIN`} info={t`Tag used to show domains that have an rcode status of NXDOMAIN`} />
        <InfoBox title={t`BLOCKED`} info={t`Tag used to show domains that are possibly blocked by a firewall.`} />
        <InfoBox
          title={t`WILDCARD SIBLING`}
          info={t`Tag used to show domains have a wildcard resolver as a sibling.`}
        />
        <InfoBox title={t`WILDCARD ENTRY`} info={t`Tag used to show domains resolve to a wildcard entry.`} />
        <InfoBox title={t`SCAN PENDING`} info={t`Tag used to show domains that have a pending web scan.`} />
        <InfoBox title={t`SPIN Top 25`} info={t`SPIN Top 25 vulnerability detected in additional findings.`} />
        <InfoBox title={t`Approved`} info={t`An asset confirmed to belong to the organization.`} />
        <InfoBox
          title={t`Dependency`}
          info={t`An asset that is owned by a third party and supports the operation of organization-owned assets.`}
        />
        <InfoBox
          title={t`Monitor Only`}
          info={t`An asset that is relevant to the organization but is not a direct part of the attack surface.`}
        />
        <InfoBox
          title={t`Candidate`}
          info={t`An asset that is suspected to belong to the organization but has not been confirmed.`}
        />
        <InfoBox
          title={t`Requires Investigation`}
          info={t`An asset that requires further investigation to determine its relationship to the organization.`}
        />
      </InfoPanel>

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
        orderByOptions={[{ value: 'DOMAIN', text: t`Domain` }, ...orderByOptions]}
        placeholder={t`Search for a domain`}
        onToggle={onToggle}
        searchTip={domainSearchTip}
        totalRecords={totalCount}
      />

      {orgSlug !== 'my-tracker' && (
        <Flex align="center" mb="2">
          <Text mr="2" fontWeight="bold" fontSize="lg">
            <Trans>Filters:</Trans>
          </Text>
          <FilterList
            filters={filters}
            setFilters={setFilters}
            resetToFirstPage={resetToFirstPage}
            filterTagOptions={filterTagOptions}
            guidanceTagOptions={guidanceTagOptions}
          />
        </Flex>
      )}

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
    </Box>
  )
}

OrganizationDomains.propTypes = {
  orgSlug: string,
  orgName: string,
  userHasPermission: bool,
  availableTags: array,
  negativeFindings: array,
}
