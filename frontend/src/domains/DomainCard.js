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
import { ABTestingWrapper, ABTestVariant } from '../app/ABTestWrapper'
import { StatusBadge } from './StatusBadge'
import { ScanDomainButton } from './ScanDomainButton'
import { StarIcon } from '@chakra-ui/icons'
import { FAVOURITE_DOMAIN, UNFAVOURITE_DOMAIN } from '../graphql/mutations'
import { useMutation } from '@apollo/client'
import { useUserVar } from '../utilities/userState'

export function DomainCard({
  id,
  url,
  status,
  hasDMARCReport,
  tags,
  isHidden,
  isArchived,
  rcode,
  blocked,
  webScanPending,
  userHasPermission,
  ...rest
}) {
  const location = useLocation()
  const toast = useToast()
  const { isLoggedIn, isEmailValidated } = useUserVar()

  const [favouriteDomain, { _loading, _error }] = useMutation(FAVOURITE_DOMAIN, {
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

  const [unfavouriteDomain, { _l, _e }] = useMutation(UNFAVOURITE_DOMAIN, {
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
    px: { base: 2, md: 0 },
    py: { base: 1, md: 2 },
    mx: { base: 0, md: 1 },
    my: { base: 2, md: 0 },
    bg: 'gray.100',
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
          <Flex flexDirection="row">
            <Text fontWeight="semibold" mr="6">
              <Trans>Domain:</Trans>
            </Text>
            {rcode === 'NXDOMAIN' && (
              <Badge colorScheme="red" mr="auto" alignSelf="center">
                NXDOMAIN
              </Badge>
            )}
            {blocked && (
              <Badge colorScheme="red" mr="auto" alignSelf="center">
                <Trans>Blocked</Trans>
              </Badge>
            )}
            {webScanPending && (
              <Badge color="info" mr="auto" alignSelf="center">
                <Trans>Scan Pending</Trans>
              </Badge>
            )}
          </Flex>
          <Text isTruncated>{url}</Text>

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
            <ABTestingWrapper insiderVariantName="B">
              <ABTestVariant name="B">
                {isHidden && (
                  <Tag m="0.5" bg="gray.50" borderWidth="1px" borderColor="gray.900">
                    <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                      <Trans>HIDDEN</Trans>
                    </TagLabel>
                  </Tag>
                )}
                {isArchived && (
                  <Tag m="0.5" bg="gray.50" borderWidth="1px" borderColor="gray.900">
                    <TagLabel textColor="primary" fontWeight="bold" mx="auto">
                      <Trans>ARCHIVED</Trans>
                    </TagLabel>
                  </Tag>
                )}{' '}
              </ABTestVariant>
            </ABTestingWrapper>
          </Flex>
        </Box>
        <Divider variant="card" display={{ md: 'none' }} />

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
          {isEmailValidated() && userHasPermission && (
            <Button
              variant="primary"
              as={RouteLink}
              to={{
                pathname: `/domains/${url}`,
                state: { from: location.pathname },
              }}
              px="10"
            >
              <Text whiteSpace="noWrap">
                <Trans>View Results</Trans>
              </Text>
            </Button>
          )}
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
        <Stack ml={4}>
          {isEmailValidated() && userHasPermission && <ScanDomainButton domainUrl={url} />}
          {isLoggedIn() &&
            (location.pathname.match('my-tracker') ? (
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
                onClick={async () => {
                  await favouriteDomain({ variables: { domainId: id } })
                }}
                variant="primary"
                aria-label={`favourite ${url}`}
                icon={<StarIcon />}
              />
            ))}
        </Stack>
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
  isHidden: bool,
  isArchived: bool,
  blocked: bool,
  webScanPending: bool,
  userHasPermission: bool,
}
