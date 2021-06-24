import React from 'react'
import { Trans } from '@lingui/macro'
import { Link, ListItem, Stack, Text } from '@chakra-ui/core'
import { Link as RouteLink, useRouteMatch } from 'react-router-dom'
import { number, string } from 'prop-types'

export function Organization({ name, slug, domainCount, ...rest }) {
  const { path, _url } = useRouteMatch()
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]} flexWrap="wrap">
        <Stack isInline>
          <Link as={RouteLink} to={`${path}/${slug}`}>
            <Text fontWeight="bold" fontSize="xl">
              {name}
            </Text>
          </Link>
        </Stack>
        <Text>
          <Trans>Internet facing services: {domainCount}</Trans>
        </Text>
      </Stack>
    </ListItem>
  )
}

Organization.propTypes = {
  name: string.isRequired,
  slug: string.isRequired,
  domainCount: number.isRequired,
}
