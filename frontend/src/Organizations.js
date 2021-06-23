import React, { useCallback, useState } from 'react'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
  Heading,
  Box,
  Divider,
  Flex,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Stack,
  Text,
} from '@chakra-ui/core'
import { PAGINATED_ORGANIZATIONS as FORWARD } from './graphql/queries'
import { useUserVar } from './useUserVar'
import { OrganizationCard } from './OrganizationCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { RelayPaginationControls } from './RelayPaginationControls'
import { useDebouncedFunction } from './useDebouncedFunction'

export default function Organisations() {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(10)
  const { currentUser } = useUserVar()

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const orderIconName = orderDirection === 'ASC' ? 'arrow-up' : 'arrow-down'

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
    fetchHeaders: { authorization: currentUser.jwt },
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
      <Heading as="h1" mb="4" textAlign={['center', 'left']}>
        <Trans>Organizations</Trans>
      </Heading>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
          mb={{ base: '4', md: '8' }}
        >
          <InputGroup mb={{ base: '8px', md: '0' }} flexGrow={1}>
            <InputLeftElement>
              <Icon name="search" color="gray.300" />
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
