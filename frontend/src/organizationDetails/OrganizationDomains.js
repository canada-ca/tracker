import React, { useState, useCallback } from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Text, useDisclosure } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'
import { number, string } from 'prop-types'

import { DomainCard } from '../domains/DomainCard'
import { ListOf } from '../components/ListOf'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import {
  PAGINATED_ORG_DOMAINS as FORWARD,
  MY_TRACKER_DOMAINS,
} from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { SubdomainWarning } from '../domains/SubdomainWarning'

export function OrganizationDomains({ orgSlug }) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)

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
        }

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
    fetchForward: orgSlug === 'my-tracker' ? MY_TRACKER_DOMAINS : FORWARD,
    recordsPerPage: domainsPerPage,
    relayRoot:
      orgSlug === 'my-tracker'
        ? 'findMyTracker.domains'
        : 'findOrganizationBySlug.domains',
    variables: queryVariables,
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
      {(
        { id, domain, status, hasDMARCReport, claimTags, hidden, archived },
        index,
      ) => (
        <ErrorBoundary
          key={`${id}:${index}`}
          FallbackComponent={ErrorFallbackMessage}
        >
          <DomainCard
            id={id}
            url={domain}
            status={status}
            hasDMARCReport={hasDMARCReport}
            tags={claimTags}
            isHidden={hidden}
            isArchived={archived}
            mb="3"
          />
        </ErrorBoundary>
      )}
    </ListOf>
  )

  return (
    <Box>
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
    </Box>
  )
}

OrganizationDomains.propTypes = { domainsPerPage: number, orgSlug: string }
