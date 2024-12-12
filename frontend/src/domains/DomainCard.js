import React, { memo } from 'react'
import { t, Trans } from '@lingui/macro'
import { Badge, Box, Button, Flex, IconButton, ListItem, Stack, Tag, TagLabel, Text, useToast } from '@chakra-ui/react'
import { Link as RouteLink, useLocation } from 'react-router-dom'
import { array, bool, object, string } from 'prop-types'
import { StatusBadge } from './StatusBadge'
import { ScanDomainButton } from './ScanDomainButton'
import { LinkIcon, StarIcon } from '@chakra-ui/icons'
import { FAVOURITE_DOMAIN, UNFAVOURITE_DOMAIN } from '../graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserVar } from '../utilities/userState'
import { isEqual } from 'lodash-es'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

function DomainCard({
  id,
  url,
  status,
  hasDMARCReport,
  tags,
  assetState,
  isArchived,
  rcode,
  blocked,
  wildcardSibling,
  wildcardEntry,
  webScanPending,
  hasEntrustCertificate,
  userHasPermission,
  cveDetected,
  ...rest
}) {
  const location = useLocation()
  const toast = useToast()
  const { isLoggedIn, isEmailValidated } = useUserVar()

  const [favouriteDomain] = useMutation(FAVOURITE_DOMAIN, {
    onError: ({ message }) => {
      toast({
        title: t`An error occurred while favouriting a domain.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: t`Favourited Domain`,
        description: t`You have successfully added ${url} to myTracker.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const [unfavouriteDomain] = useMutation(UNFAVOURITE_DOMAIN, {
    refetchQueries: ['FindMyTracker'],
    awaitRefetchQueries: true,

    onError: ({ message }) => {
      toast({
        title: t`An error occurred while unfavouriting a domain.`,
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
    onCompleted() {
      toast({
        title: t`Unfavourited Domain`,
        description: t`You have successfully removed ${url} from myTracker.`,
        status: 'success',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  const statusGroupingProps = {
    flexDirection: { base: 'column', md: 'row' },
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    px: { base: 2, md: 2 },
    py: { base: 1, md: 2 },
    mx: { base: 0, md: 1 },
    my: { base: 2, md: 0 },
    bg: 'gray.100',
  }

  const assetStateLabels = {
    APPROVED: t`Approved`,
    DEPENDENCY: t`Dependency`,
    MONITOR_ONLY: t`Monitor Only`,
    CANDIDATE: t`Candidate`,
    REQUIRES_INVESTIGATION: t`Requires Investigation`,
  }

  return (
    <ListItem {...rest}>
      <Box
        width="100%"
        px="4"
        py="4"
        borderWidth="1px"
        rounded="md"
        borderColor="black"
        alignItems={{ base: 'flex-start', md: 'center' }}
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <Flex>
          <Text fontSize="lg" fontWeight="bold">
            {url}
          </Text>
          <ABTestWrapper insiderVariantName="B">
            <ABTestVariant name="B">
              {assetState && (
                <Badge ml="1" colorScheme="green" variant="solid" alignSelf="center" className="asset-state">
                  {assetStateLabels[assetState]}
                </Badge>
              )}
            </ABTestVariant>
          </ABTestWrapper>
          <Flex ml="auto" className="system-tags">
            {rcode === 'NXDOMAIN' && (
              <Badge colorScheme="red" variant="subtle" alignSelf="center">
                NXDOMAIN
              </Badge>
            )}
            {isArchived && (
              <Badge ml="2" colorScheme="red" variant="subtle" alignSelf="center">
                <Trans>Archived</Trans>
              </Badge>
            )}
            {blocked && (
              <Badge ml="2" colorScheme="blue" variant="subtle" alignSelf="center">
                <Trans>Blocked</Trans>
              </Badge>
            )}
            <ABTestWrapper insiderVariantName="B">
              <ABTestVariant name="B">
                {wildcardSibling && (
                  <Badge ml="2" colorScheme={wildcardEntry ? 'red' : 'blue'} variant="subtle" alignSelf="center">
                    {wildcardEntry ? <Trans>Wildcard Entry</Trans> : <Trans>Wildcard Sibling</Trans>}
                  </Badge>
                )}
                {hasEntrustCertificate && (
                  <Badge ml="2" colorScheme="blue" variant="subtle" alignSelf="center">
                    <Trans>Entrust Certificate</Trans>
                  </Badge>
                )}
              </ABTestVariant>
            </ABTestWrapper>
            {webScanPending && (
              <Badge ml="2" colorScheme="blue" variant="outline" alignSelf="center">
                <Trans>Scan Pending</Trans>
              </Badge>
            )}
          </Flex>
        </Flex>
        <Flex>
          <Box mr="auto" className="user-tags">
            <Flex flexWrap="wrap">
              {tags?.map((tag, idx) => {
                return (
                  <Tag key={idx} my="1" mr="1" bg="gray.50" borderWidth="1px" borderColor="gray.900">
                    <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                      {tag}
                    </TagLabel>
                  </Tag>
                )
              })}

              {userHasPermission && cveDetected && (
                <Tag
                  my="1"
                  bg="gray.50"
                  borderWidth="1px"
                  borderColor="gray.900"
                  as={RouteLink}
                  to={`/domains/${url}/additional-findings#vulnerabilities`}
                >
                  <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                    <Trans>SPIN Top 25</Trans> <LinkIcon />
                  </TagLabel>
                </Tag>
              )}
            </Flex>
          </Box>

          <Box ml="auto" {...statusGroupingProps}>
            <Text textAlign="center" color="gray.600">
              <Trans>Web (HTTPS/TLS)</Trans>
            </Text>
            <Flex>
              <StatusBadge text={t`HTTPS`} status={status.https} />
              <StatusBadge text={t`HSTS`} status={status.hsts} />
              <StatusBadge text={t`Certificates`} status={status.certificates} />
              <StatusBadge text={t`Protocols`} status={status.protocols} />
              <StatusBadge text={t`Ciphers`} status={status.ciphers} />
              <StatusBadge text={t`Curves`} status={status.curves} />
            </Flex>
          </Box>
          <Box {...statusGroupingProps} px="1">
            <Text textAlign="center" color="gray.600">
              <Trans>Email</Trans>
            </Text>
            <Flex>
              <StatusBadge text="SPF" status={status.spf} />
              <StatusBadge text="DKIM" status={status.dkim} />
              <StatusBadge text="DMARC" status={status.dmarc} />
            </Flex>
          </Box>

          <Stack fontSize="sm" justifySelf="flex-end" alignSelf="stretch" justifyContent="center" mx="2">
            <Button
              className="view-results-button"
              variant="primary"
              as={RouteLink}
              to={{
                pathname: isLoggedIn() ? `/domains/${url}` : '/sign-in',
                state: { from: location.pathname },
              }}
              px="10"
            >
              <Text whiteSpace="noWrap">
                <Trans>View Results</Trans>
              </Text>
            </Button>
            {hasDMARCReport && (
              <Button
                variant="primary"
                as={RouteLink}
                to={`/domains/${url}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
              >
                <Text whiteSpace="noWrap">
                  <Trans>DMARC Report</Trans>
                </Text>
              </Button>
            )}
          </Stack>
          {isLoggedIn() && (
            <Stack justifyContent="center">
              {isEmailValidated() && userHasPermission && (
                <ScanDomainButton className="request-scan-button" domainUrl={url} />
              )}
              {location.pathname.match('my-tracker') ? (
                <IconButton
                  onClick={async () => {
                    await unfavouriteDomain({ variables: { domainId: id } })
                  }}
                  variant="primary"
                  aria-label={`unfavourite ${url}`}
                  icon={<StarIcon color="moderate" />}
                />
              ) : (
                <IconButton
                  className="favourite-button"
                  onClick={async () => {
                    await favouriteDomain({ variables: { domainId: id } })
                  }}
                  variant="primary"
                  aria-label={`favourite ${url}`}
                  icon={<StarIcon />}
                />
              )}
            </Stack>
          )}
        </Flex>
      </Box>
    </ListItem>
  )
}

DomainCard.propTypes = {
  id: string,
  url: string.isRequired,
  rcode: string,
  status: object,
  hasDMARCReport: bool,
  tags: array,
  isArchived: bool,
  blocked: bool,
  wildcardSibling: bool,
  wildcardEntry: bool,
  webScanPending: bool,
  hasEntrustCertificate: bool,
  userHasPermission: bool,
  assetState: string,
  cveDetected: bool,
}

const memoizedDomainCard = memo(DomainCard, (prevProps, nextProps) => {
  if (Object.keys(prevProps).length !== Object.keys(nextProps).length) return false

  return isEqual(prevProps, nextProps)
})

export { memoizedDomainCard as DomainCard }
