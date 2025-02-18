import React, { useCallback, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { ListOf } from '../components/ListOf'
import {
  Box,
  Divider,
  Flex,
  Heading,
  IconButton,
  ListItem,
  Switch,
  Text,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react'
import { ErrorBoundary } from 'react-error-boundary'

import { OrganizationCard } from './OrganizationCard'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { LoadingMessage } from '../components/LoadingMessage'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { useDebouncedFunction } from '../utilities/useDebouncedFunction'
import { FIND_ORGANIZATION_BY_SLUG, PAGINATED_ORGANIZATIONS as FORWARD } from '../graphql/queries'
import { SearchBox } from '../components/SearchBox'
import { UserIcon } from '../theme/Icons'
import { RequestOrgInviteModal } from './RequestOrgInviteModal'
import { useUserVar } from '../utilities/userState'
import { AffiliationFilterSwitch } from '../components/AffiliationFilterSwitch'
import { useQuery } from '@apollo/client'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'
import { TourComponent } from '../userOnboarding/components/TourComponent'

export default function Organizations() {
  const { isLoggedIn, hasAffiliation } = useUserVar()
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(50)
  const { isOpen: inviteRequestIsOpen, onOpen, onClose } = useDisclosure()
  const [orgInfo, setOrgInfo] = useState({})
  const [isVerified, setIsVerified] = useState(true)
  const [isAffiliated, setIsAffiliated] = useState(hasAffiliation())

  const memoizedSetDebouncedSearchTermCallback = useCallback(() => {
    setDebouncedSearchTerm(searchTerm)
  }, [searchTerm])

  useDebouncedFunction(memoizedSetDebouncedSearchTermCallback, 500)

  const { isOpen, onToggle } = useDisclosure()

  const {
    loading: unclaimedLoading,
    error: unclaimedError,
    data: unclaimedData,
  } = useQuery(FIND_ORGANIZATION_BY_SLUG, {
    variables: { orgSlug: 'unclaimed' },
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
    totalCount,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    variables: {
      field: orderField,
      direction: orderDirection,
      search: debouncedSearchTerm,
      includeSuperAdminOrg: false,
      isVerified,
      isAffiliated,
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
        {({ id, name, slug, acronym, domainCount, verified, summaries, userHasPermission }, index) => (
          <ErrorBoundary key={`${slug}:${index}`} FallbackComponent={ErrorFallbackMessage}>
            <Flex align="center">
              <ListItem mb="3" mr={userHasPermission ? '3rem' : '2'} w="100%" className="organization-card">
                <OrganizationCard
                  slug={slug}
                  name={name}
                  acronym={acronym}
                  domainCount={domainCount}
                  verified={verified}
                  summaries={summaries}
                />
              </ListItem>
              {isLoggedIn() && !userHasPermission && (
                <>
                  <IconButton
                    className="request-invite-button"
                    aria-label={t`Request Invite`}
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

  let unclaimedCard
  if (unclaimedLoading) {
    unclaimedCard = (
      <LoadingMessage>
        <Trans>Unclaimed</Trans>
      </LoadingMessage>
    )
  } else if (unclaimedError) {
    unclaimedCard = <ErrorFallbackMessage error={unclaimedError} />
  } else if (unclaimedData?.findOrganizationBySlug) {
    const { name, slug, acronym, domainCount, verified, summaries } = unclaimedData?.findOrganizationBySlug
    unclaimedCard = (
      <Box mr="3rem" mb="3">
        <OrganizationCard
          className="unclaimed-card"
          slug={slug}
          name={name}
          acronym={acronym}
          domainCount={domainCount}
          verified={verified}
          summaries={summaries}
          w="100%"
        />
      </Box>
    )
  }

  return (
    <Box w="100%" px="4">
      <TourComponent />
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
          totalRecords={totalCount}
        />

        <ABTestWrapper insiderVariantName="B">
          <ABTestVariant name="B">{unclaimedCard}</ABTestVariant>
        </ABTestWrapper>

        <Flex align="center" mb="2">
          <Text mr="2" fontWeight="bold" fontSize="lg" className="filter">
            <Trans>Filters:</Trans>
          </Text>
          <Tooltip label={t`Filter list to verified organizations only.`}>
            <Flex align="center" mr="2" className="filter-verified">
              <Switch
                isFocusable={true}
                aria-label="Show only verified organizations"
                mx="2"
                defaultChecked={isVerified}
                onChange={(e) => {
                  setIsVerified(e.target.checked)
                  resetToFirstPage()
                }}
              />
              <CheckCircleIcon color="blue.500" boxSize="icons.md" />
            </Flex>
          </Tooltip>
          {isLoggedIn() && <Divider orientation="vertical" borderLeftColor="gray.900" height="1.5rem" />}
          <AffiliationFilterSwitch
            isAffiliated={isAffiliated}
            setIsAffiliated={setIsAffiliated}
            resetToFirstPage={resetToFirstPage}
          />
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
          totalRecords={totalCount}
        />
      </ErrorBoundary>
    </Box>
  )
}
