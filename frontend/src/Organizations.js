import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
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
import { PAGINATED_ORGANIZATIONS as FORWARD } from './graphql/queries'
import { OrganizationCard } from './OrganizationCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { RelayPaginationControls } from './RelayPaginationControls'
import { useDebouncedFunction } from './useDebouncedFunction'
import { InfoButton, InfoBox, InfoPanel } from './InfoPanel'

export default function Organisations() {
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

  const [infoState, changeInfoState] = React.useState({
    isHidden: true,
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
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
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
    <Layout>
      <Stack direction="row" mb="4">
        <Heading as="h1" textAlign="left">
          <Trans>Organizations</Trans>
        </Heading>

        <Box ml="auto" />

        <InfoButton
          label="Glossary"
          state={infoState}
          changeState={changeInfoState}
        />
      </Stack>

      <InfoPanel state={infoState}>
        <InfoBox
          title="Organization Name"
          info="Displays the Name of the organization, its acronym, and a blue check mark if it is a verified organization."
        />
        <InfoBox
          title="Services"
          info="Shows the number of domains that the organization is in control of."
        />
        <InfoBox
          title="Web Configuration"
          info="Shows the percentage of Domains that have passed both HTTPS and SSL requiremnts."
        />
        <InfoBox
          title="Email Configuration"
          info="Shows the percentage of Domains that have passed the requirements for SPF, DKIM, and DMARC."
        />
        <Divider borderColor="gray.500" />
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
          <InputGroup mb={{ base: '8px', md: '0' }} flexGrow={1}>
            <InputLeftElement>
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              type="text"
              placeholder={t`Search for an organization`}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                resetToFirstPage()
              }}
            />
          </InputGroup>
          <Stack isInline align="center" ml={{ md: '10%' }}>
            <Text fontSize="md" fontWeight="bold" textAlign="center">
              <Trans>Sort by: </Trans>
            </Text>
            <Select
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
    </Layout>
  )
}
