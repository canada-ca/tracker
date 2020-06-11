import React from 'react'
import { Link, ListItem, Stack } from '@chakra-ui/core'
import { Link as RouteLink, useRouteMatch } from 'react-router-dom'
import { string } from 'prop-types'
export function Organization({ name, slug, ...rest }) {
  const { path, _url } = useRouteMatch()
  console.log(`path: ${path}, url: ${_url}`)
  return (
    <ListItem {...rest}>
      <Stack spacing={4} padding={[1, 2, 3]} direction="row" flexWrap="wrap">
        <Link as={RouteLink} to={`${path}/${slug}`}>
          {name}
        </Link>
      </Stack>
    </ListItem>
  )
}

Organization.propTypes = { name: string, slug: string }
