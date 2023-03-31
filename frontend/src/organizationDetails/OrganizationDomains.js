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
  TagRightIcon,
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
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import {
  PAGINATED_ORG_DOMAINS as FORWARD,
  MY_TRACKER_DOMAINS,
} from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { SubdomainWarning } from '../domains/SubdomainWarning'
import { Formik } from 'formik'
import {
  getRequirement,
  schemaToValidation,
} from '../utilities/fieldRequirements'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { ABTestingWrapper } from '../app/ABTestWrapper'
import { ABTestVariant } from '../app/ABTestVariant'

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

  const validationSchema = schemaToValidation({
    filterCategory: getRequirement('field'),
    comparison: getRequirement('field'),
    filterValue: getRequirement('field'),
  })

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
    { value: t`NEW`, text: t`New` },
    { value: t`PROD`, text: t`Prod` },
    { value: t`STAGING`, text: t`Staging` },
    { value: t`TEST`, text: t`Test` },
    { value: t`WEB`, text: t`Web` },
    { value: t`INACTIVE`, text: t`Inactive` },
    { value: `HIDDEN`, text: t`Hidden` },
    { value: `ARCHIVED`, text: t`Archived` },
  ]

  const domainList = loading ? (
    <LoadingMessage>
      <Trans>Domains</Trans>
    </LoadingMessage>
  ) : (
    <Box>
      <ABTestingWrapper insiderVariantName="B">
        <ABTestVariant name="B">
          <Box px="2" py="2">
            <Formik
              validationSchema={validationSchema}
              initialValues={{
                filterCategory: '',
                comparison: '',
                filterValue: '',
              }}
              onSubmit={(values, { resetForm }) => {
                setFilters([
                  ...new Map(
                    [...filters, values].map((item) => {
                      if (item['filterCategory'] !== 'TAGS')
                        return [item['filterCategory'], item]
                      else return [item['filterValue'], item]
                    }),
                  ).values(),
                ])
                resetForm()
              }}
            >
              {({ handleChange, handleSubmit, values, errors }) => {
                return (
                  <form
                    onSubmit={handleSubmit}
                    role="form"
                    aria-label="form"
                    name="form"
                  >
                    <Flex align="center">
                      <Text fontWeight="bold" mr="2">
                        <Trans>Filters:</Trans>
                      </Text>
                      <Box maxW="25%" mx="1">
                        <Select
                          name="filterCategory"
                          borderColor="black"
                          onChange={(e) => {
                            if (
                              (values.filterCategory === 'TAGS' &&
                                e.target.value !== 'TAGS') ||
                              (values.filterCategory !== 'TAGS' &&
                                e.target.value === 'TAGS')
                            ) {
                              values.filterValue = ''
                            }
                            handleChange(e)
                          }}
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
                          <option value="TAGS">
                            <Trans>Tag</Trans>
                          </option>
                        </Select>
                        <Text color="red.500" mt={0}>
                          {errors.filterCategory}
                        </Text>
                      </Box>
                      <Box maxW="25%" mx="1">
                        <Select
                          name="comparison"
                          borderColor="black"
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
                        <Text color="red.500" mt={0}>
                          {errors.comparison}
                        </Text>
                      </Box>
                      <Box maxW="25%" mx="1">
                        <Select
                          name="filterValue"
                          borderColor="black"
                          onChange={handleChange}
                        >
                          <option hidden value="">
                            <Trans>Status or tag</Trans>
                          </option>
                          {values.filterCategory === 'TAGS' ? (
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
                        <Text color="red.500" mt={0}>
                          {errors.filterValue}
                        </Text>
                      </Box>
                      <Button ml="auto" variant="primary" type="submit">
                        <Trans>Apply</Trans>
                      </Button>
                    </Flex>
                  </form>
                )
              }}
            </Formik>
          </Box>
        </ABTestVariant>
      </ABTestingWrapper>
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
    </Box>
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
        onToggle={onToggle}
      />

      <SubdomainWarning mb="4" />

      <ABTestingWrapper insiderVariantName="B">
        <ABTestVariant name="B">
          <Flex align="center" mb="2">
            {filters.map(({ filterCategory, comparison, filterValue }, idx) => {
              const statuses = {
                HTTPS_STATUS: `HTTPS`,
                HSTS_STATUS: `HSTS`,
                CIPHERS_STATUS: `Ciphers`,
                CURVES_STATUS: t`Curves`,
                PROTOCOLS_STATUS: t`Protocols`,
                SPF_STATUS: `SPF`,
                DKIM_STATUS: `DKIM`,
                DMARC_STATUS: `DMARC`,
              }
              return (
                <Tag
                  fontSize="lg"
                  borderWidth="1px"
                  borderColor="gray.300"
                  key={idx}
                  mx="1"
                  my="1"
                  bg={
                    filterValue === 'PASS'
                      ? 'strongMuted'
                      : filterValue === 'FAIL'
                      ? 'weakMuted'
                      : filterValue === 'INFO'
                      ? 'infoMuted'
                      : 'gray.100'
                  }
                >
                  {comparison === 'NOT_EQUAL' && <Text mr="1">!</Text>}
                  {filterCategory === 'TAGS' ? (
                    <TagLabel>{filterValue}</TagLabel>
                  ) : (
                    <>
                      <TagLabel>{statuses[filterCategory]}</TagLabel>
                      <TagRightIcon
                        color={
                          filterValue === 'PASS'
                            ? 'strong'
                            : filterValue === 'FAIL'
                            ? 'weak'
                            : 'info'
                        }
                        as={
                          filterValue === 'PASS'
                            ? CheckCircleIcon
                            : filterValue === 'FAIL'
                            ? WarningIcon
                            : InfoIcon
                        }
                      />
                    </>
                  )}

                  <TagCloseButton
                    onClick={() =>
                      setFilters(filters.filter((_, i) => i !== idx))
                    }
                  />
                </Tag>
              )
            })}
          </Flex>
        </ABTestVariant>
      </ABTestingWrapper>

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
