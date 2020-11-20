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
import { useRouteMatch, useHistory } from 'react-router-dom'
import { string, number, bool } from 'prop-types'
import { Trans } from '@lingui/macro'

export function OrganizationCard({
  name,
  acronym,
  slug,
  domainCount,
  verified,
  ...rest
}) {
  const { path, _url } = useRouteMatch()
  const history = useHistory()
  const webValue = Math.floor(Math.random() * 10) * 10 + 10
  const emailValue = Math.floor(Math.random() * 10) * 10 + 10

  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          history.push(`${path}/${slug}`)
        }}
        _hover={{ bg: 'gray.100' }}
        p="8"
        mx="auto"
        as="button"
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
        >
          <Text fontWeight="bold">
            <Trans>Web Configuration</Trans>
          </Text>
          <Text>{webValue}%</Text>
          <Progress value={webValue} bg="gray.300" w={['50%', '100%']} />
        </Box>
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Text fontWeight="bold">
            <Trans>Email Configuration</Trans>
          </Text>
          <Text>{emailValue}%</Text>
          <Progress value={emailValue} bg="gray.300" w={['50%', '100%']} />
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
}
