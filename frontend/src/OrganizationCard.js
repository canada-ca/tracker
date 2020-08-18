import React from 'react'
import { Trans } from '@lingui/macro'
import { Text, ListItem, Progress, PseudoBox, Box } from '@chakra-ui/core'
import { useRouteMatch, useHistory } from 'react-router-dom'
import { string, number } from 'prop-types'

export function OrganizationCard({ name, slug, domainCount, ...rest }) {
  const { path, _url } = useRouteMatch()
  const history = useHistory()
  return (
    <ListItem {...rest}>
      <PseudoBox
        width="100%"
        display={{ md: 'flex' }}
        alignItems="center"
        onClick={() => {
          history.push(`${path}/${slug}`)
        }}
        _hover={{ borderColor: 'gray.100', bg: 'gray.100' }}
        p="8"
      >
        <Box flexShrink="0" minW="15%">
          <Text mt="1" fontSize="md" fontWeight="semibold">
            {name}
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Text fontSize="md" minW="10%">
            Services: {domainCount}
          </Text>
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Text>HTTPS:</Text>
          <Progress value={80} bg="gray.300" w={['50%', '100%']} />
        </Box>
        <Box flexShrink="0" ml={{ md: 2 }} mr={{ md: 2 }}>
          <Text>DMARC:</Text>
          <Progress value={80} bg="gray.300" w={['50%', '100%']} />
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
