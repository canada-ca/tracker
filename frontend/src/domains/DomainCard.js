import React from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  ListItem,
  Stack,
  Tag,
  TagLabel,
  Text,
  useToast,
} from '@chakra-ui/react'
import { Link as RouteLink, useLocation } from 'react-router-dom'
import { array, bool, object, string } from 'prop-types'
import { StatusBadge } from './StatusBadge'
import { ScanDomainButton } from './ScanDomainButton'
import { LinkIcon, StarIcon } from '@chakra-ui/icons'
import { FAVOURITE_DOMAIN, UNFAVOURITE_DOMAIN } from '../graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserVar } from '../utilities/userState'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

export function DomainCard({
  id,
  url,
  status,
  hasDMARCReport,
  // tags,
  assetState,
  isArchived,
  rcode,
  blocked,
  wildcardSibling,
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

  const tags = ['NEW', 'PROD', 'WEB', 'INACTIVE', 'TEST', 'MAIL']

  const statusGroupingProps = {
    flexDirection: { base: 'column', md: 'row' },
    border: '1px solid',
    borderColor: 'gray.300',
    borderRadius: 'md',
    px: { base: 2, md: 0 },
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
      <Flex
        width="100%"
        px="4"
        py={hasDMARCReport || isLoggedIn() ? '2.5' : '6'}
        borderWidth="1px"
        rounded="md"
        borderColor="black"
        pl={{ md: '8' }}
        alignItems={{ base: 'flex-start', md: 'center' }}
        flexDirection={{ base: 'column', md: 'row' }}
      >
        <Box
          flexGrow={{ md: '2' }}
          flexBasis={{ md: '5em' }}
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ md: '3em' }}
        >
          <Flex flexDirection="row" justifyContent="space-around">
            {/* <ABTestWrapper insiderVariantName="B">
              <ABTestVariant name="B"> */}
            {assetState && (
              <Badge colorScheme="blue" variant="subtle" alignSelf="center">
                {assetStateLabels[assetState]}
              </Badge>
            )}
            {/* </ABTestVariant>
            </ABTestWrapper> */}
            {/* {rcode === 'NXDOMAIN' && ( */}
            <Badge colorScheme="red" variant="subtle" alignSelf="center">
              NXDOMAIN
            </Badge>
            {/* )} */}
            {/* {isArchived && ( */}
            <Badge ml="2" colorScheme="red" variant="subtle" alignSelf="center">
              <Trans>Archived</Trans>
            </Badge>
            {/* )} */}
            {/* {blocked && ( */}
            <Badge ml="2" colorScheme="red" variant="outline" alignSelf="center">
              <Trans>Blocked</Trans>
            </Badge>
            {/* )} */}
            {/* {wildcardSibling && (
              <ABTestWrapper insiderVariantName="B">
                <ABTestVariant name="B"> */}
            <Badge ml="2" colorScheme="red" variant="outline" alignSelf="center">
              <Trans>Wildcard</Trans>*
            </Badge>
            {/* </ABTestVariant>
              </ABTestWrapper>
            )} */}
            {/* {hasEntrustCertificate && (
              <ABTestWrapper insiderVariantName="B">
                <ABTestVariant name="B"> */}
            <Badge ml="2" colorScheme="red" variant="outline" alignSelf="center">
              <Trans>Entrust Certificate</Trans>
            </Badge>
            {/* </ABTestVariant>
              </ABTestWrapper>
            )} */}
            {/* {webScanPending && ( */}
            <Badge color="info" variant="outline" alignSelf="center" ml="auto">
              <Trans>Scan Pending</Trans>
            </Badge>
            {/* )} */}
          </Flex>

          <Flex align="center" my="2">
            <Box>
              <Text my="1" fontSize="lg" fontWeight="bold" isTruncated>
                {url}
              </Text>
              <Flex flexWrap="wrap">
                {tags?.map((tag, idx) => {
                  return (
                    <Tag key={idx} m="0.5" bg="gray.50" borderWidth="1px" borderColor="gray.900">
                      <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                        {tag}
                      </TagLabel>
                    </Tag>
                  )
                })}
              </Flex>
              {/* <ABTestWrapper insiderVariantName="B">
              <ABTestVariant name="B"> */}
              {/* {userHasPermission && cveDetected && ( */}
              <Tag
                m="0.5"
                bg="gray.50"
                borderWidth="1px"
                borderColor="gray.900"
                as={RouteLink}
                to={`/domains/${url}/additional-findings#vulnerabilities`}
              >
                <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                  <Trans>Vulnerability</Trans> <LinkIcon />
                </TagLabel>
              </Tag>
              {/* )} */}
              {/* </ABTestVariant>
            </ABTestWrapper> */}
            </Box>
            <Flex ml="auto">
              <Box {...statusGroupingProps} px="1">
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
              <Divider variant="card" display={{ md: 'none' }} />

              <Stack
                fontSize="sm"
                justifySelf="flex-end"
                alignSelf="stretch"
                justifyContent="center"
                ml={{ base: 0, md: '4' }}
              >
                <Button
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
                {/* {hasDMARCReport && ( */}
                <Button
                  variant="primary"
                  as={RouteLink}
                  to={`/domains/${url}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
                >
                  <Text whiteSpace="noWrap">
                    <Trans>DMARC Report</Trans>
                  </Text>
                </Button>
                {/* )} */}
              </Stack>
              <Stack ml={4}>
                <ScanDomainButton domainUrl={url} />
                {/* {isLoggedIn() &&
                  (location.pathname.match('my-tracker') ? (
                    <IconButton
                      onClick={async () => {
                        await unfavouriteDomain({ variables: { domainId: id } })
                      }}
                      variant="primary"
                      aria-label={`unfavourite ${url}`}
                      icon={<StarIcon color="moderate" />}
                    />
                  ) : ( */}
                <IconButton
                  onClick={async () => {
                    await favouriteDomain({ variables: { domainId: id } })
                  }}
                  variant="primary"
                  aria-label={`favourite ${url}`}
                  icon={<StarIcon />}
                />
                {/* ))} */}
              </Stack>
            </Flex>
          </Flex>
        </Box>
      </Flex>
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
  webScanPending: bool,
  hasEntrustCertificate: bool,
  userHasPermission: bool,
  assetState: string,
  cveDetected: bool,
}
