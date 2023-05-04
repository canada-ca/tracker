import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { ListOf } from '../components/ListOf'
import { Box, Divider, Flex, Heading, IconButton, Text, useDisclosure } from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationCard } from './OrganizationCard'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { PAGINATED_ORGANIZATIONS as FORWARD } from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { UserIcon } from '../theme/Icons'
import { bool } from 'prop-types'
import { RequestOrgInviteModal } from './RequestOrgInviteModal'

export default function Organizations({ isLoggedIn }) {
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(10)
  const { isOpen: inviteRequestIsOpen, onOpen, onClose } = useDisclosure()
  const [orgInfo, setOrgInfo] = useState({})

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const { isOpen, onToggle } = useDisclosure()

  const { loading, isLoadingMore, error, nodes, next, previous, resetToFirstPage, hasNextPage, hasPreviousPage } =
    usePaginatedCollection({
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

  const orderByOptions = [
    { value: 'NAME', text: t`Name` },
    { value: 'ACRONYM', text: t`Acronym` },
    { value: 'DOMAIN_COUNT', text: t`Services` },
    { value: 'VERIFIED', text: t`Verified` },
  ]

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
        {({ id, name, slug, acronym, domainCount, verified, summaries }, index) => (
          <ErrorBoundary key={`${slug}:${index}`} FallbackComponent={ErrorFallbackMessage}>
            <Flex align="center">
              <OrganizationCard
                slug={slug}
                name={name}
                acronym={acronym}
                domainCount={domainCount}
                verified={verified}
                summaries={summaries}
                mb="3"
                mr="2"
                w="100%"
              />
              {isLoggedIn && (
                <>
                  <IconButton
                    variant="primary"
                    icon={<UserIcon color="white" boxSize="icons.md" />}
                    onClick={() => {
                      setOrgInfo({ id, name })
                      onOpen()
                    }}
                  />
                  <RequestOrgInviteModal
                    isOpen={inviteRequestIsOpen}
                    onClose={onClose}
                    orgId={orgInfo.id}
                    orgName={orgInfo.name}
                  />
                </>
              )}
            </Flex>
          </ErrorBoundary>
        )}
      </ListOf>
    )
  }

  return (
    <Box w="100%" px="4">
      <Heading as="h1" textAlign="left" mb="4">
        <Trans>Organizations</Trans>
      </Heading>

      <InfoPanel isOpen={isOpen} onToggle={onToggle}>
        <InfoBox
          title={t`Organization Name`}
          info={t`Displays the Name of the organization, its acronym, and a blue check mark if it is a verified organization.`}
        />
        <InfoBox title={t`Services`} info={t`Shows the number of domains that the organization is in control of.`} />
        <InfoBox
          title={t`HTTPS Configured`}
          info={t`Shows the percentage of domains which have HTTPS configured and upgrade HTTP connections to HTTPS`}
        />
        <InfoBox
          title={t`DMARC Configuration`}
          info={t`Shows the percentage of domains which have a valid DMARC policy configuration.`}
        />
        <Divider borderColor="gray.500" mb={4} />
        <Trans>Further details for each organization can be found by clicking on its row.</Trans>
      </InfoPanel>

      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <SearchBox
          selectedDisplayLimit={orgsPerPage}
          setSelectedDisplayLimit={setOrgsPerPage}
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
          placeholder={t`Search for an organization`}
          onToggle={onToggle}
        />
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

Organizations.propTypes = {
  isLoggedIn: bool,
}
