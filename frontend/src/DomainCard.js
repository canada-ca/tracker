import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Text,
  ListItem,
  Box,
  Icon,
  Stack,
  Divider,
  Flex,
} from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'
import { object, string, boolean } from 'prop-types'
import { TrackerButton } from './TrackerButton'

export function DomainCard({ url, lastRan, status, hasDMARCReport, ...rest }) {
  const generateStatusIcon = (status) => {
    let statusIcon
    if (status === 'PASS') {
      statusIcon = <Icon name="check-circle" color="strong" size="icons.sm" />
    } else if (status === 'FAIL') {
      statusIcon = <Icon name="warning" color="weak" size="icons.sm" />
    } else {
      statusIcon = <Icon name="info" color="info" size="icons.sm" />
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
        <Divider
          orientation={{ base: 'horizontal', md: 'vertical' }}
          alignSelf="stretch"
        />
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
        <Divider
          orientation={{ base: 'horizontal', md: 'vertical' }}
          alignSelf="stretch"
        />
        {lastRan && (
          <Stack
            flexDirection={{ base: 'column', md: 'row' }}
            flexGrow={{ base: 0, md: '1' }}
          >
            <Box ml={{ md: 2 }} mr={{ md: 2 }}>
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
            <Box ml={{ md: 2 }} mr={{ md: 2 }}>
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
            <Box ml={{ md: 2 }} mr={{ md: 2 }}>
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
            <Box ml={{ md: 2 }} mr={{ md: 2 }}>
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
            <Box ml={{ md: 2 }} mr={{ md: 2 }}>
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
            <Divider
              orientation={{ base: 'horizontal', md: 'vertical' }}
              alignSelf="stretch"
            />
          </Stack>
        )}
        <Stack fontSize="sm" justifySelf="flex-end" alignSelf="stretch">
          <TrackerButton
            variant="primary"
            as={RouteLink}
            to={`/domains/${url}`}
            px="10"
          >
            <Text whiteSpace="noWrap">
              <Trans>Guidance</Trans>
            </Text>
          </TrackerButton>

          {hasDMARCReport && (
            <TrackerButton
              variant="primary"
              as={RouteLink}
              to={`/domains/${url}/dmarc-report/LAST30DAYS/${new Date().getFullYear()}`}
            >
              <Text whiteSpace="noWrap">
                <Trans>DMARC Report</Trans>
              </Text>
            </TrackerButton>
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
  hasDMARCReport: boolean,
}
