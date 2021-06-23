import React from 'react'
import {
  Text,
  ListItem,
  Progress,
  PseudoBox,
  Box,
  Stack,
  Divider,
  Icon,
} from '@chakra-ui/core'
import { useRouteMatch, Link as RouteLink } from 'react-router-dom'
import { string, number, bool, object } from 'prop-types'
import { Trans } from '@lingui/macro'

export function OrganizationCard({
  name,
  acronym,
  slug,
  domainCount,
  verified,
  summaries,
  ...rest
}) {
  const { path, _url } = useRouteMatch()
  const smallDevice = window.matchMedia('(max-width: 500px)').matches
  let webValue = 0
  let mailValue = 0
  const webSummary =
    summaries?.web?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  const mailSummary =
    summaries?.mail?.categories?.filter((cat) => {
      return cat.name === 'pass'
    }) || []
  if (webSummary[0]?.percentage) webValue = webSummary[0]?.percentage
  if (mailSummary[0]?.percentage) mailValue = mailSummary[0]?.percentage

  if (webValue % 1 >= 0.5) {
    webValue = Math.ceil(webValue)
  } else {
    webValue = Math.floor(webValue)
  }

  if (mailValue % 1 >= 0.5) {
    mailValue = Math.ceil(mailValue)
  } else {
    mailValue = Math.floor(mailValue)
  }

  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        _hover={{ bg: ['', 'gray.100'] }}
        p="4"
        mx="auto"
        as={!smallDevice ? RouteLink : ''}
        to={`${path}/${slug}`}
      >
        <Box flexShrink="0" minW="50%" maxW={['100%', '50%']} mb={['2', '0']}>
          <Stack isInline align="center">
            <Text
              mt="1"
              fontSize={['lg', 'md']}
              fontWeight="semibold"
              as="u"
              isTruncated
            >
              {name}
            </Text>
            <Text mt="1" fontSize={['lg', 'md']} fontWeight="semibold">
              ({acronym})
            </Text>
            {verified && (
              <Icon name="check-circle" color="blue.500" size="icons.sm" />
            )}
          </Stack>
        </Box>
        <Divider orientation="vertical" />
        <Box
          flexShrink="0"
          minW="10%"
          ml={{ md: 2 }}
          mr={{ md: 2 }}
          mb={['2', '0']}
        >
          <Stack isInline align="center">
            <Text fontWeight="semibold">
              <Trans>Services: {domainCount}</Trans>
            </Text>
          </Stack>
        </Box>
        <Divider orientation="vertical" />
        <Box
          flexShrink="0"
          minW="15%"
          ml={{ md: 2 }}
          mr={{ md: 2 }}
          mb={['2', '0']}
          textAlign="left"
        >
          <Text fontWeight="bold">
            <Trans>Web Configuration</Trans>
          </Text>
          <Text>{webValue}%</Text>
          <Progress value={webValue} bg="gray.300" />
        </Box>
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} textAlign="left">
          <Text fontWeight="bold">
            <Trans>Email Configuration</Trans>
          </Text>
          <Text>{mailValue}%</Text>
          <Progress value={mailValue} bg="gray.300" />
        </Box>
      </PseudoBox>
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
