import React from 'react'
import { ArrowLeftIcon } from '@chakra-ui/icons'

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  Divider,
  Tooltip,
  Switch,
} from '@chakra-ui/react'

import { ScanDomainButton } from '../domains/ScanDomainButton'
import { Link as RouteLink, useHistory, useLocation, useParams } from 'react-router-dom'
import { WebGuidance } from './WebGuidance'
import { EmailGuidance } from './EmailGuidance'
import { t, Trans } from '@lingui/macro'
import { useQuery } from '@apollo/client'
import { DOMAIN_GUIDANCE_PAGE } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { useUserVar } from '../utilities/userState'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

//Imports added to make the canned message with request invite button work
import { ListOf } from '../components/ListOf'
import { useCallback, useState, useEffect } from 'react'
import { Organizations } from '../organizations/Organizations'
import { RequestOrgInviteModal } from '../organizations/RequestOrgInviteModal'
import { OrganizationCard } from '../organizations/OrganizationCard'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { ErrorBoundary } from 'react-error-boundary'
import { SearchBox } from '../components/SearchBox'
import { usePaginatedCollection } from '../utilities/usePaginatedCollection'
import { PAGINATED_ORGANIZATIONS as FORWARD } from '../graphql/queries'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { AffiliationFilterSwitch } from '../components/AffiliationFilterSwitch'
import { RelayPaginationControls } from '../components/RelayPaginationControls'
import { UserIcon } from '../theme/Icons'

function GuidancePage() {
  const { isOpen, onOpen, onClose, onToggle, inviteRequestIsOpen } = useDisclosure()
  const { domainSlug: domain } = useParams()

  const { loading, error, data } = useQuery(DOMAIN_GUIDANCE_PAGE, {
    variables: { domain: domain },
    errorPolicy: 'all',
  })

  const history = useHistory()
  const location = useLocation()
  const { isLoggedIn, isEmailValidated } = useUserVar()
  const { from } = location.state || { from: { pathname: '/domains' } }

  const [orgInfo, setOrgInfo] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [orgsPerPage, setOrgsPerPage] = useState(10)
  const { hasAffiliation } = useUserVar()
  const [isAffiliated, setIsAffiliated] = useState(hasAffiliation())
  const [isVerified, setIsVerified] = useState(true)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [orderDirection, setOrderDirection] = useState('ASC')
  const [orderField, setOrderField] = useState('NAME')
  const { isLoadingMore, nodes, next, previous, resetToFirstPage, hasNextPage, hasPreviousPage } =
    usePaginatedCollection({
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

  const orderByOptions = [
    { value: 'NAME', text: t`Name` },
    { value: 'ACRONYM', text: t`Acronym` },
    { value: 'DOMAIN_COUNT', text: t`Services` },
    { value: 'VERIFIED', text: t`Verified` },
  ]

  let domainName, webScan, dnsScan, mxRecordDiff, organizations, dmarcPhase, rcode, status, userHasPermission

  if (data && data.findDomainByDomain) {
    ;({
      domain: domainName,
      web: webScan,
      dnsScan,
      mxRecordDiff,
      organizations,
      dmarcPhase,
      rcode,
      status,
      userHasPermission,
    } = data.findDomainByDomain)
  }

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Guidance results</Trans>
      </LoadingMessage>
    )
  }

  let orgList
  if (!userHasPermission) {
    // Insert code for organization list here
    orgList = (
      <ListOf
        elements={organizations.edges}
        ifEmpty={() => (
          <Text layerStyle="loadingMessage">
            <Trans>No Organizations</Trans>
          </Text>
        )}
        mb="4"
      >
        {({ id, name, slug, acronym, domainCount, verified, summaries, userHasPermission }, index) => (
          <ErrorBoundary key={`${slug}:${index}`} ErrorFallbackComponent={ErrorFallbackMessage}>
            <Flex align="center">
              <OrganizationCard
                id={organizations.edges[index].node.id}
                slug={organizations.edges[index].node.slug}
                name={organizations.edges[index].node.name}
                acronym={organizations.edges[index].node.acronym}
                domainCount={organizations.edges[index].node.domainCount}
                verified={verified}
                summaries={summaries}
                mb="3"
                mr={userHasPermission ? '3rem' : '2'}
                w="100%"
              />
              {isLoggedIn() && !userHasPermission && (
                <>
                  <IconButton
                    aria-label={t`Request Invite`}
                    variant="primary"
                    icon={<UserIcon color="white" boxSize="icons.md" />}
                    onClick={() => {
                      //setOrgInfo({ id, name })
                      onOpen()
                    }}
                  />
                  <RequestOrgInviteModal isOpen={isOpen} onClose={onClose} orgId={id} orgName={name} />
                </>
              )}
            </Flex>
          </ErrorBoundary>
        )}
      </ListOf>
    )

    return (
      <Box align="center" w="100%" px={4}>
        <Text textAlign="center" fontSize="2xl" fontWeight="bold">
          <Trans>
            Error while retrieving scan data for {domainName}. <br />
            This could be due to insufficient user privileges or the domain does not exist in the system.
          </Trans>
        </Text>

        {/* code for list of organizations from organizations page */}
        <Heading as="h1" textAlign="left" mb="4">
          <Trans>Organizations</Trans>
        </Heading>

        {/* <InfoPanel isOpen={isOpen} onToggle={onToggle}>
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
        </InfoPanel> */}

        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
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

  if (error) {
    return <ErrorFallbackMessage error={error} />
  }

  let guidanceResults
  if (rcode !== 'NOERROR') {
    guidanceResults = (
      <Box fontSize="lg">
        <Flex>
          <Text mr="1">
            <Trans>A DNS request for this service has resulted in the following error code:</Trans>
          </Text>
          <Text fontWeight="bold">{rcode}</Text>
        </Flex>
        <Text>
          <Trans>
            If you believe this could be the result of an issue with the scan, rescan the service using the refresh
            button. If you believe this is because the service no longer exists (NXDOMAIN), this domain should be
            removed from all affiliated organizations.
          </Trans>
        </Text>
      </Box>
    )
  } else {
    const { results: webResults, timestamp } = webScan?.edges[0]?.node
    const { node: dnsResults } = dnsScan?.edges[0]

    const noScanData = (
      <Flex fontSize="xl" fontWeight="bold" textAlign="center" px="2" py="1">
        <Text>
          <Trans>
            No scan data is currently available for this service. You may request a scan using the refresh button, or
            wait up to 24 hours for data to refresh.
          </Trans>
        </Text>
      </Flex>
    )

    guidanceResults = (
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="4">
          <Tab borderTopWidth="0.25">
            <Trans>Web Guidance</Trans>
          </Tab>
          <Tab borderTopWidth="0.25">
            <Trans>Email Guidance</Trans>
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {webResults.length === 0 ? (
              noScanData
            ) : (
              <WebGuidance webResults={webResults} status={status} timestamp={timestamp} />
            )}
          </TabPanel>
          <TabPanel>
            {dnsScan.edges.length === 0 ? (
              noScanData
            ) : (
              <EmailGuidance
                dnsResults={dnsResults}
                dmarcPhase={dmarcPhase}
                status={status}
                mxRecordDiff={mxRecordDiff}
              />
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    )
  }

  return (
    <Flex flexDirection="column" width="100%">
      <Flex flexDirection={{ base: 'column', md: 'row' }} alignItems="center" mb="4">
        <IconButton
          icon={<ArrowLeftIcon />}
          onClick={() => history.push(from)}
          color="gray.900"
          fontSize="2xl"
          aria-label="back"
          mr="0.5rem"
        />
        <Heading textAlign={{ base: 'center', md: 'left' }} mr="auto">
          {domainName.toUpperCase()}
        </Heading>
        {data.findDomainByDomain.webScanPending && (
          <Badge color="info" alignSelf="center" fontSize="md">
            <Trans>Scan Pending</Trans>
          </Badge>
        )}
        {data.findDomainByDomain.wildcardSibling && (
          <ABTestWrapper insiderVariantName="B">
            <ABTestVariant name="B">
              <Badge colorScheme="red" alignSelf="center" fontSize="md">
                <Trans>Wildcard</Trans>*
              </Badge>
            </ABTestVariant>
          </ABTestWrapper>
        )}
        {isLoggedIn() && isEmailValidated() && <ScanDomainButton domainUrl={domainName} ml="2" />}
        {data.findDomainByDomain.hasDMARCReport && (
          <Button
            ml="2"
            variant="primary"
            as={RouteLink}
            to={`/domains/${domainName}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
          >
            <Text whiteSpace="noWrap">
              <Trans>DMARC Report</Trans>
            </Text>
          </Button>
        )}
      </Flex>
      <Flex maxW="auto" mb="2" px="2" py="1">
        <Text fontWeight="bold" mr="2">
          <Trans>Organization(s):</Trans>
        </Text>
        {organizations.edges.map(({ node }, idx) => {
          return (
            <>
              <Link as={RouteLink} to={`/organizations/${node.slug}`} key={idx}>
                {node.name} ({node.acronym})
              </Link>
              {idx !== organizations.edges.length - 1 && <Text mr="1">,</Text>}
            </>
          )
        })}
      </Flex>
      {guidanceResults}
    </Flex>
  )
}

export default GuidancePage
