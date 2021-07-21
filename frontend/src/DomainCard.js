import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Box,
  Button,
  Divider,
  Flex,
  ListItem,
  Stack,
  Text,
} from '@chakra-ui/react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { Link as RouteLink } from 'react-router-dom'
import { bool, object, string } from 'prop-types'

export function DomainCard({ url, lastRan, status, hasDMARCReport, ...rest }) {
  const generateStatusIcon = (status) => {
    let statusIcon
    if (status === 'PASS') {
      statusIcon = <CheckCircleIcon color="strong" size="icons.sm" />
    } else if (status === 'FAIL') {
      statusIcon = <WarningIcon color="weak" size="icons.sm" />
    } else {
      statusIcon = <InfoIcon color="info" size="icons.sm" />
    }
    return statusIcon
  }

  return (
    <ListItem {...rest}>
      <Flex
        width="100%"
        p="4"
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
          <Text fontWeight="semibold">
            <Trans>Domain:</Trans>
          </Text>
          <Text isTruncated>{url}</Text>
        </Box>
        <Divider variant="card" display={{ md: 'none' }} />
        <Box
          flexShrink="0"
          textAlign="left"
          mr={{ base: 0, md: '4' }}
          flexGrow="1"
        >
          {lastRan ? (
            <Box>
              <Text fontWeight="bold">
                <Trans>Last scanned:</Trans>
              </Text>
              {lastRan.substring(0, 16)}
            </Box>
          ) : (
            <Text fontWeight="bold" fontSize="sm">
              <Trans>Not scanned yet.</Trans>
            </Text>
          )}
        </Box>
        <Divider variant="card" display={{ md: 'none' }} />
        {lastRan && (
          <>
            <Flex
              flexDirection={{ base: 'column', md: 'row' }}
              flexGrow={{ base: 0, md: '1' }}
            >
              <Box mx={{ md: 2 }}>
                <Stack
                  align="center"
                  flexDirection={{ base: 'row', md: 'column' }}
                  justifyContent="space-between"
                  spacing={0}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    mb={{ base: 0, md: '2' }}
                    mr={{ base: '2', md: 0 }}
                  >
                    HTTPS:
                  </Text>
                  {generateStatusIcon(status.https)}
                </Stack>
              </Box>
              <Box mx={{ md: 2 }}>
                <Stack
                  align="center"
                  flexDirection={{ base: 'row', md: 'column' }}
                  justifyContent="space-between"
                  spacing={0}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    mb={{ base: 0, md: '2' }}
                    mr={{ base: '2', md: 0 }}
                  >
                    SSL:
                  </Text>
                  {generateStatusIcon(status.ssl)}
                </Stack>
              </Box>
              <Box mx={{ md: 2 }}>
                <Stack
                  align="center"
                  flexDirection={{ base: 'row', md: 'column' }}
                  justifyContent="space-between"
                  spacing={0}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    mb={{ base: 0, md: '2' }}
                    mr={{ base: '2', md: 0 }}
                  >
                    SPF:
                  </Text>
                  {generateStatusIcon(status.spf)}
                </Stack>
              </Box>
              <Box mx={{ md: 2 }}>
                <Stack
                  align="center"
                  flexDirection={{ base: 'row', md: 'column' }}
                  justifyContent="space-between"
                  spacing={0}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    mb={{ base: 0, md: '2' }}
                    mr={{ base: '2', md: 0 }}
                  >
                    DKIM:
                  </Text>
                  {generateStatusIcon(status.dkim)}
                </Stack>
              </Box>
              <Box mx={{ md: 2 }}>
                <Stack
                  align="center"
                  flexDirection={{ base: 'row', md: 'column' }}
                  justifyContent="space-between"
                  spacing={0}
                >
                  <Text
                    fontWeight="bold"
                    fontSize="sm"
                    mb={{ base: 0, md: '2' }}
                    mr={{ base: '2', md: '0' }}
                  >
                    DMARC:
                  </Text>
                  {generateStatusIcon(status.dmarc)}
                </Stack>
              </Box>
            </Flex>
            <Divider variant="card" display={{ md: 'none' }} />
          </>
        )}
        <Stack
          fontSize="sm"
          justifySelf="flex-end"
          alignSelf="stretch"
          justifyContent="center"
        >
          <Button
            variant="primary"
            as={RouteLink}
            to={`/domains/${url}`}
            px="10"
          >
            <Text whiteSpace="noWrap">
              <Trans>Guidance</Trans>
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
      </Flex>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  lastRan: string,
  status: object,
  hasDMARCReport: bool,
}
