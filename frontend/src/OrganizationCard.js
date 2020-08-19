import React from 'react'
// import { Trans } from '@lingui/macro'
import {
  Text,
  ListItem,
  Progress,
  PseudoBox,
  Box,
  Stack,
  Divider,
} from '@chakra-ui/core'
import { useRouteMatch, useHistory } from 'react-router-dom'
import { string, number } from 'prop-types'

export function OrganizationCard({ name, slug, domainCount, ...rest }) {
  const { path, _url } = useRouteMatch()
  const history = useHistory()
  const webValue = Math.floor(Math.random() * 100) + 1
  const emailValue = Math.floor(Math.random() * 100) + 1

  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          history.push(`${path}/${slug}/domains`)
        }}
        _hover={{ borderColor: 'gray.100', bg: 'gray.100' }}
        p="8"
        mx="auto"
      >
        <Box flexShrink="0" minW="15%" mb={['2', '0']}>
          <Text mt="1" fontSize="lg" fontWeight="semibold" as="u">
            {name}
          </Text>
        </Box>
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} mb={['2', '0']}>
          <Stack isInline align="center">
            <Text minW="10%" fontWeight="semibold">
              Services:
            </Text>
            <Text fontSize="lg">{domainCount}</Text>
          </Stack>
        </Box>
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }} mb={['2', '0']}>
          <Text fontWeight="bold">Web Configuration</Text>
          <Text>{webValue}%</Text>
          <Progress value={webValue} bg="gray.300" w={['50%', '100%']} />
        </Box>
        <Divider orientation="vertical" />
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Text fontWeight="bold">Email Configuration</Text>
          <Text>{emailValue}%</Text>
          <Progress value={emailValue} bg="gray.300" w={['50%', '100%']} />
        </Box>
      </PseudoBox>
    </ListItem>
  )
}

OrganizationCard.propTypes = {
  name: string.isRequired,
  slug: string.isRequired,
  domainCount: number.isRequired,
}
