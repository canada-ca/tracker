import React, { useState, useCallback } from 'react'
import { t, Trans } from '@lingui/macro'
import { Box, Divider, Link, Text } from '@chakra-ui/react'
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
import { PAGINATED_ORG_DOMAINS as FORWARD } from '../graphql/queries'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { SearchBox } from '../components/SearchBox'

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
    relayRoot: 'findOrganizationBySlug.domains',
    variables: {
      slug: orgSlug,
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

  const orderByOptions = [
    { value: 'DOMAIN', text: t`Domain` },
    { value: 'POLICY_STATUS', text: t`ITPIN Status` },
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
          <Box>
            <DomainCard
              url={domain}
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
    <Box>
      <InfoButton
        w="100%"
        label="Glossary"
        state={infoState}
        changeState={changeInfoState}
        mb="2"
      />

      <InfoPanel state={infoState}>
        <InfoBox title={t`Domain`} info={t`The domain address.`} />
        <InfoBox
          title={t`ITPIN`}
          info={
            <>
              <Trans>Shows if the domain is compliant with</Trans>
              <Link
                ml="1"
                href="https://www.canada.ca/en/government/system/digital-government/modern-emerging-technologies/policy-implementation-notices/implementing-https-secure-web-connections-itpin.html"
                isExternal
              >
                ITPIN 2018-01
                <ExternalLinkIcon mx="2px" />
              </Link>
            </>
          }
        />
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
    </Box>
  )
}

OrganizationDomains.propTypes = { domainsPerPage: number, orgSlug: string }
