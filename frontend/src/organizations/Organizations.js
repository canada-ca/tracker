import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { ListOf } from '../components/ListOf'
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
  Text,
} from '@chakra-ui/react'
import { SearchIcon, ArrowDownIcon, ArrowUpIcon } from '@chakra-ui/icons'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationCard } from './OrganizationCard'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { InfoButton, InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { PAGINATED_ORGANIZATIONS as FORWARD } from '../graphql/queries'

export default function Organizations() {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(10)

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const orderIconName =
    orderDirection === 'ASC' ? <ArrowUpIcon /> : <ArrowDownIcon />

  const [infoState, changeInfoState] = useState({
    isVisible: false,
  })

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
    variables: {
      field: orderField,
      direction: orderDirection,
      search: debouncedSearchTerm,
      includeSuperAdminOrg: false,
    },
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-first',
    recordsPerPage: orgsPerPage,
    relayRoot: 'findMyOrganizations',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  // Set the list contents only to loading message when loading
  // Prevents select active option from resetting when loading
  let orgList
  if (loading) {
    orgList = (
      <LoadingMessage>
        <Trans>Organizations</Trans>
      </LoadingMessage>
    )
  } else {
    orgList = (
      <ListOf
        elements={nodes}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Organizations</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ name, slug, acronym, domainCount, verified, summaries }, index) => (
          <ErrorBoundary
            key={`${slug}:${index}`}
            FallbackComponent={ErrorFallbackMessage}
          >
            <Box>
              <OrganizationCard
                slug={slug}
                name={name}
                acronym={acronym}
                domainCount={domainCount}
                verified={verified}
                summaries={summaries}
              />
              <Divider borderColor="gray.900" />
            </Box>
          </ErrorBoundary>
        )}
      </ListOf>
    )
  }

  return (
    <Box w="100%" px={4}>
      <Stack direction="row" justify="space-between" mb="4">
        <Heading as="h1" textAlign="left">
          <Trans>Organizations</Trans>
        </Heading>

        <InfoButton
          label={t`Glossary`}
          state={infoState}
          changeState={changeInfoState}
        />
      </Stack>

      <InfoPanel state={infoState}>
        <InfoBox
          title={t`Organization Name`}
          info={t`Displays the Name of the organization, its acronym, and a blue check mark if it is a verified organization.`}
        />
        <InfoBox
          title={t`Services`}
          info={t`Shows the number of domains that the organization is in control of.`}
        />
        <InfoBox
          title={t`Web Configuration`}
          info={t`Shows the percentage of Domains that have passed both HTTPS, and protocol and cipher requiremnts.`}
        />
        <InfoBox
          title={t`Email Configuration`}
          info={t`Shows the percentage of Domains that have passed the requirements for SPF, DKIM, and DMARC.`}
        />
        <Divider borderColor="gray.500" mb={4} />
        <Trans>
          Further details for each organization can be found by clicking on its
          row.
        </Trans>
      </InfoPanel>

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
                placeholder={t`Search for an organization`}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  resetToFirstPage()
                }}
                aria-label="Organization Search Bar"
              />
            </InputGroup>
          </Flex>
          <Stack isInline align="center" ml={{ md: '5%' }}>
            <Text
              as="label"
              htmlFor="Sort-by-field"
              fontSize="md"
              fontWeight="bold"
              textAlign="center"
            >
              <Trans>Sort by: </Trans>
            </Text>
            <Select
              id="Sort-by-field"
              aria-label="Sort by field"
              w="fit-content"
              size="md"
              variant="filled"
              onChange={(e) => {
                setOrderField(e.target.value)
                resetToFirstPage()
              }}
            >
              <option key="NAME" value="NAME">
                {t`Name`}
              </option>
              <option key="ACRONYM" value="ACRONYM">
                {t`Acronym`}
              </option>
              <option key="DOMAIN_COUNT" value="DOMAIN_COUNT">
                {t`Services`}
              </option>
              <option key="VERIFIED" value="VERIFIED">
                {t`Verified`}
              </option>
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
        {orgList}
        <RelayPaginationControls
          onlyPagination={false}
          selectedDisplayLimit={orgsPerPage}
          setSelectedDisplayLimit={setOrgsPerPage}
          displayLimitOptions={[5, 10, 20, 50, 100]}
          resetToFirstPage={resetToFirstPage}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
          isLoadingMore={isLoadingMore}
        />
      </ErrorBoundary>
    </Box>
  )
}
