import React from 'react'
import { Box, Flex, ListItem, Progress, Stack, Text } from '@chakra-ui/react'
import { CheckCircleIcon } from '@chakra-ui/icons'
import { Link as RouteLink, useRouteMatch } from 'react-router-dom'
import { bool, number, object, string } from 'prop-types'
import { Trans } from '@lingui/macro'

export function OrganizationCard({
  name,
  acronym,
  slug,
  domainCount,
  verified,
  summaries,
  disableLink = false,
  ...rest
}) {
  const { path, _url } = useRouteMatch()
  let httpsValue = 0
  let dmarcValue = 0
  const httpsSummary =
    summaries?.https?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  const dmarc =
    summaries?.dmarc?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  if (httpsSummary[0]?.percentage) httpsValue = httpsSummary[0]?.percentage
  if (dmarc[0]?.percentage) dmarcValue = dmarc[0]?.percentage

  if (httpsValue % 1 >= 0.5) {
    httpsValue = Math.ceil(httpsValue)
  } else {
    httpsValue = Math.floor(httpsValue)
  }

  if (dmarcValue % 1 >= 0.5) {
    dmarcValue = Math.ceil(dmarcValue)
  } else {
    dmarcValue = Math.floor(dmarcValue)
  }

  return (
    <ListItem {...rest}>
      <Flex
        width="100%"
        borderWidth="1px"
        borderColor="black"
        rounded="md"
        direction={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'flex-start', md: 'center' }}
        _hover={!disableLink && { md: { bg: ['', 'gray.100'] } }}
        p="4"
        as={!disableLink && RouteLink}
        to={!disableLink && `${path}/${slug}`}
      >
        <Box
          flexGrow={{ md: '2' }}
          flexBasis={{ md: '5em' }}
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ md: '6em' }}
          maxWidth="100%"
        >
          <Stack isInline align="center">
            <Text fontSize="lg" fontWeight="semibold" textDecoration="underline" isTruncated>
              {name}
            </Text>
            <Text fontSize="lg" fontWeight="semibold">
              ({acronym})
            </Text>
            {verified && <CheckCircleIcon color="blue.500" size="icons.sm" aria-label="Verified Organization" />}
          </Stack>
        </Box>
        <Box
          flexGrow={{ md: '0' }}
          flexBasis={{ md: '7em' }}
          mr={{ md: '1em' }}
          flexShrink={{ md: '0.5' }}
          minWidth={{ md: '2em' }}
          align="center"
        >
          <Text fontWeight="semibold">
            <Trans>Services: {domainCount}</Trans>
          </Text>
        </Box>

        <Box mr={{ md: '1em' }} flexShrink={{ md: '0.5' }} minWidth={{ base: '100%', md: '3em' }} textAlign="left">
          <Text fontWeight="bold">
            <Trans>HTTPS Configured</Trans>
          </Text>
          <Text>{httpsValue}%</Text>
          <Progress value={httpsValue} bg="gray.300" aria-hidden="true" />
        </Box>

        <Box flexShrink={{ md: '0.5' }} minWidth={{ base: '100%', md: '3em' }} textAlign="left">
          <Text fontWeight="bold">
            <Trans>DMARC Configured</Trans>
          </Text>
          <Text>{dmarcValue}%</Text>
          <Progress value={dmarcValue} bg="gray.300" aria-hidden="true" />
        </Box>
      </Flex>
    </ListItem>
  )
}

OrganizationCard.propTypes = {
  name: string.isRequired,
  acronym: string.isRequired,
  slug: string.isRequired,
  domainCount: number.isRequired,
  verified: bool,
  summaries: object,
  domains: object,
}
