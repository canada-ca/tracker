import React from 'react'
import { Text, Link, Stack, Icon, Heading } from '@chakra-ui/core'
import { Layout } from './Layout'
import { Link as ReactRouterLink } from 'react-router-dom'
import { useLingui } from '@lingui/react'
import { t, Trans } from '@lingui/macro'

export default function DomainDetails() {
  const { i18n } = useLingui()
  // const { path, _url } = useRouteMatch()
  // console.log(`path: ${path}, url: ${_url}`)

  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Stack isInline align="center">
          <Link as={ReactRouterLink} to={'/organizations'}>
            <Icon
              alt={i18n._(t`back to organizations`)}
              color="gray.900"
              name="arrow-left"
              fontSize="2xl"
            />
          </Link>
          <Heading as="h1">Domain Details</Heading>
        </Stack>
      </Stack>
    </Layout>
  )
}
