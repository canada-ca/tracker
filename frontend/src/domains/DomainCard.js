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
import { Link as RouteLink } from 'react-router-dom'
import { bool, object, string } from 'prop-types'

import { StatusBadge } from './StatusBadge'

export function DomainCard({ url, status, hasDMARCReport, ...rest }) {
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
        <Divider variant="card" display={{ md: 'none' }} />
        <Flex {...statusGroupingProps}>
          <StatusBadge text="Policy" status={status.policy} />
          <StatusBadge text="HTTPS" status={status.https} />
          <StatusBadge text="HSTS" status={status.hsts} />
          <StatusBadge text="Ciphers" status={status.ciphers} />
          <StatusBadge text="Curves" status={status.curves} />
          <StatusBadge text="Protocols" status={status.protocols} />
        </Flex>
        <Flex {...statusGroupingProps}>
          <StatusBadge text="SPF" status={status.spf} />
          <StatusBadge text="DKIM" status={status.dkim} />
          <StatusBadge text="DMARC" status={status.dmarc} />
        </Flex>
        <Divider variant="card" display={{ md: 'none' }} />
        <Stack
          fontSize="sm"
          justifySelf="flex-end"
          alignSelf="stretch"
          justifyContent="center"
          ml={4}
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
  status: object,
  hasDMARCReport: bool,
}
