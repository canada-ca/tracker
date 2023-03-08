import React, { useState, useCallback } from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Button,
  Flex,
  Select,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
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
import { Formik } from 'formik'
import { createValidationSchema } from '../utilities/fieldRequirements'

export function OrganizationDomains({ orgSlug }) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('DOMAIN')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [domainsPerPage, setDomainsPerPage] = useState(10)
  const [filters, setFilters] = useState([])

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
    { value: 'HTTPS_STATUS', text: t`HTTPS Status` },
    { value: 'HSTS_STATUS', text: t`HSTS Status` },
    { value: 'CIPHERS_STATUS', text: t`Ciphers Status` },
    { value: 'CURVES_STATUS', text: t`Curves Status` },
    { value: 'PROTOCOLS_STATUS', text: t`Protocols Status` },
    { value: 'SPF_STATUS', text: t`SPF Status` },
    { value: 'DKIM_STATUS', text: t`DKIM Status` },
    { value: 'DMARC_STATUS', text: t`DMARC Status` },
  ]

  const filterTagOptions = [
    { value: 'NEW', text: t`New` },
    { value: 'PROD', text: t`Prod` },
    { value: 'STAGING', text: t`Staging` },
    { value: 'TEST', text: t`Test` },
    { value: 'WEB', text: t`Web` },
    { value: 'INACTIVE', text: t`Inactive` },
    { value: 'HIDDEN', text: t`Hidden` },
    { value: 'ARCHIVED', text: t`Archived` },
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
        orderByOptions={[
          { value: 'DOMAIN', text: t`Domain` },
          ...orderByOptions,
        ]}
        placeholder={t`Search for a domain`}
      />
      <Box px="2" py="2">
        <Formik
          // validationSchema={createValidationSchema([
          //   'firstVal',
          //   'comparison',
          //   'secondVal',
          // ])}
          initialValues={{
            firstVal: '',
            comparison: '',
            secondVal: '',
          }}
          onSubmit={(values) => {
            setFilters([...filters, values])
          }}
        >
          {({ handleChange, handleSubmit, values }) => {
            return (
              <form
                onSubmit={handleSubmit}
                role="form"
                aria-label="form"
                name="form"
              >
                <Flex align="center" mb="2">
                  {filters.map(({ firstVal, comparison, secondVal }, idx) => {
                    return (
                      <Tag key={idx} mx="1">
                        <TagLabel>
                          {firstVal} {comparison} {secondVal}
                        </TagLabel>
                        <TagCloseButton
                          onClick={() =>
                            setFilters(filters.filter((_, i) => i !== idx))
                          }
                        />
                      </Tag>
                    )
                  })}
                </Flex>
                <Flex align="center">
                  <Text fontWeight="bold" mr="2">
                    <Trans>Filters:</Trans>
                  </Text>
                  <Select
                    name="firstVal"
                    maxW="20%"
                    borderColor="black"
                    mx="1"
                    onChange={handleChange}
                  >
                    <option hidden value="">
                      <Trans>Value</Trans>
                    </option>
                    {orderByOptions.map(({ value, text }, idx) => {
                      return (
                        <option key={idx} value={value}>
                          {text}
                        </option>
                      )
                    })}
                    <option value="TAG">
                      <Trans>Tag</Trans>
                    </option>
                  </Select>
                  <Select
                    name="comparison"
                    maxW="20%"
                    borderColor="black"
                    mx="1"
                    onChange={handleChange}
                  >
                    <option hidden value="">
                      <Trans>Comparison</Trans>
                    </option>
                    <option value="EQUAL">
                      <Trans>EQUALS</Trans>
                    </option>
                    <option value="NOT_EQUAL">
                      <Trans>DOES NOT EQUAL</Trans>
                    </option>
                  </Select>
                  <Select
                    name="secondVal"
                    maxW="20%"
                    borderColor="black"
                    mx="1"
                    onChange={handleChange}
                  >
                    <option hidden value="">
                      <Trans>Status or tag</Trans>
                    </option>
                    {values.firstVal === 'TAG' ? (
                      filterTagOptions.map(({ value, text }, idx) => {
                        return (
                          <option key={idx} value={value}>
                            {text}
                          </option>
                        )
                      })
                    ) : (
                      <>
                        <option value="PASS">
                          <Trans>Pass</Trans>
                        </option>
                        <option value="INFO">
                          <Trans>Info</Trans>
                        </option>
                        <option value="FAIL">
                          <Trans>Fail</Trans>
                        </option>
                      </>
                    )}
                  </Select>
                  <Button ml="auto" variant="primary" type="submit">
                    <Trans>Apply</Trans>
                  </Button>
                </Flex>
              </form>
            )
          }}
        </Formik>
      </Box>

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
