import React from 'react'
import { Trans } from '@lingui/macro'
import { Text, Link, ListItem, Stack } from '@chakra-ui/core'
import { Link as RouteLink, useRouteMatch } from 'react-router-dom'
import { string, number } from 'prop-types'
export function Organization({ name, slug, domainCount, ...rest }) {
  const { path, _url } = useRouteMatch()
  console.log(`path: ${path}, url: ${_url}`)
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]} flexWrap="wrap">
        <Link as={RouteLink} to={`${path}/${slug}`}>
          <Text fontWeight="bold">{name}</Text>
        </Link>
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
