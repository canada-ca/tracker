import React, { useState } from 'react'
import { number } from 'prop-types'
import { Trans, t } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import {
  Heading,
  Box,
  Divider,
  InputGroup,
  InputLeftElement,
  Icon,
  Input,
  Select,
  Stack,
  Text,
} from '@chakra-ui/core'
import {
  PAGINATED_ORGANIZATIONS as FORWARD,
  REVERSE_PAGINATED_ORGANIZATIONS as BACKWARD,
} from './graphql/queries'
import { useUserState } from './UserState'
import { OrganizationCard } from './OrganizationCard'
import { usePaginatedCollection } from './usePaginatedCollection'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { RelayPaginationControls } from './RelayPaginationControls'

export default function Organisations({ orgsPerPage = 10 }) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const { currentUser } = useUserState()

  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchBackward: BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    variables: { field: orderField, direction: orderDirection },
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
        ifEmpty={() => <Trans>No Organizations</Trans>}
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
        <Stack isInline spacing={3}>
          <InputGroup width="57%" mb="8px">
            <InputLeftElement>
              <Icon name="search" color="gray.300" />
            </InputLeftElement>
            <Input type="text" placeholder={t`Search for an organization`} />
          </InputGroup>
          <Text
            fontSize="md"
            fontWeight="bold"
            textAlign="center"
            ml="8%"
            mt={2}
            isTruncated
          >
            <Trans>Sort by: </Trans>
          </Text>
          <Select
            aria-label="Sort by"
            w="fit-content"
            size="md"
            variant="filled"
            onChange={(e) => {
              const value = e.target.value.split(' ')
              setOrderField(value[0])
              setOrderDirection(value[1])
            }}
          >
            <option key="ACRONYM_ASC" value="ACRONYM ASC">
              Acronym Ascending
            </option>
            <option key="ACRONYM_DESC" value="ACRONYM DESC">
              Acronym Descending
            </option>
            <option key="DOMAIN_COUNT_ASC" value="DOMAIN_COUNT ASC">
              Domains Ascending
            </option>
            <option key="DOMAIN_COUNT_DESC" value="DOMAIN_COUNT DESC">
              Domains Descending
            </option>
            <option key="NAME_ASC" value="NAME ASC">
              Name Ascending
            </option>
            <option key="NAME_DESC" value="NAME DESC">
              Name Descending
            </option>
            <option key="PROVINCE_ASC" value="PROVINCE ASC">
              Province Ascending
            </option>
            <option key="PROVINCE_DESC" value="PROVINCE DESC">
              Province Descending
            </option>
            <option key="SECTOR_ASC" value="SECTOR ASC">
              Sector Ascending
            </option>
            <option key="SECTOR_DESC" value="SECTOR DESC">
              Sector Descending
            </option>
            <option key="VERIFIED_ASC" value="VERIFIED ASC">
              Verified Ascending
            </option>
            <option key="VERIFIED_DESC" value="VERIFIED DESC">
              Verified Descending
            </option>
          </Select>
        </Stack>
        {orgList}
        <RelayPaginationControls
          onlyPagination={true}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          next={next}
          previous={previous}
        />
      </ErrorBoundary>
    </Layout>
  )
}

Organisations.propTypes = { orgsPerPage: number }
