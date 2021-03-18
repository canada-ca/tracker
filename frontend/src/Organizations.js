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
  Switch,
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
            w="10%"
            size="md"
            variant="filled"
            onChange={(e) => {
              setOrderField(e.target.value)
            }}
          >
            <option key="NAME" value="NAME">
              Name
            </option>
            <option key="DOMAIN_COUNT" value="DOMAIN_COUNT">
              Domains
            </option>
            <option key="ACRONYM" value="ACRONYM">
              Acronym
            </option>
          </Select>
          <Icon name="arrow-up" mt="12px" />
          <Switch
            size="lg"
            mt={2}
            aria-label="Toggle sort direction"
            onChange={() => {
              orderDirection === 'ASC'
                ? setOrderDirection('DESC')
                : setOrderDirection('ASC')
            }}
          />
          <Icon name="arrow-down" mt="12px" />
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
