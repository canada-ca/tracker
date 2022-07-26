import React from 'react'
import { t, Trans } from '@lingui/macro'
import {
  Box,
  Button,
  Divider,
  Flex,
  ListItem,
  SimpleGrid,
  Stack,
  Tag,
  TagLabel,
  Text,
} from '@chakra-ui/react'
import { Link as RouteLink, useLocation } from 'react-router-dom'
import { array, bool, object, string } from 'prop-types'

import { StatusBadge } from './StatusBadge'
import { ScanDomainButton } from './ScanDomainButton'

export function DomainCard({ url, status, hasDMARCReport, tags, ...rest }) {
  const location = useLocation()
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
        py={hasDMARCReport ? '2.5' : '6'}
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
          <Text fontWeight="semibold">
            <Trans>Domain:</Trans>
          </Text>
          <Text isTruncated>{url}</Text>
        </Box>
        <Divider variant="card" display={{ md: 'none' }} />
        <Flex {...statusGroupingProps} px="1">
          <StatusBadge text={t`ITPIN`} status={status.policy} />
          <StatusBadge text={t`HTTPS`} status={status.https} />
          <StatusBadge text={t`HSTS`} status={status.hsts} />
          <StatusBadge text={t`Ciphers`} status={status.ciphers} />
          <StatusBadge text={t`Curves`} status={status.curves} />
          <StatusBadge text={t`Protocols`} status={status.protocols} />
        </Flex>
        <Flex {...statusGroupingProps} px="1">
          <StatusBadge text="SPF" status={status.spf} />
          <StatusBadge text="DKIM" status={status.dkim} />
          <StatusBadge text="DMARC" status={status.dmarc} />
        </Flex>
        <Divider variant="card" display={{ md: 'none' }} />
        <SimpleGrid columns={3} spacing={1}>
          {tags?.map(({ label }, idx) => {
            return (
              <Tag
                key={idx}
                m="2"
                borderRadius="full"
                justifySelf={{ base: 'start', md: 'end' }}
                borderWidth="1px"
                borderColor="gray.900"
              >
                <TagLabel>{label}</TagLabel>
              </Tag>
            )
          })}
        </SimpleGrid>
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
              pathname: `/domains/${url}`,
              state: { from: location.pathname },
            }}
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
        <ScanDomainButton domainUrl={url} ml={4} />
      </Flex>
    </ListItem>
  )
}

DomainCard.propTypes = {
  url: string.isRequired,
  status: object,
  hasDMARCReport: bool,
  tags: array,
}
