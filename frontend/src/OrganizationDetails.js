import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { t, Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { ListOf } from './ListOf'
import { Domain } from './Domain'
import { Link, Icon, Heading, Stack, useToast } from '@chakra-ui/core'
import { ORGANIZATION_BY_SLUG } from './graphql/queries'
import { useLingui } from '@lingui/react'
import { useUserState } from './UserState'
import { Link as ReactRouterLink, useParams } from 'react-router-dom'

export default function OrganizationDetails() {
  const { i18n } = useLingui()
  const { orgSlug } = useParams()
  const { currentUser } = useUserState()
  const toast = useToast()
  const { loading, _error, data } = useQuery(ORGANIZATION_BY_SLUG, {
    variables: { slug: orgSlug },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: (error) => {
      const [_, message] = error.message.split(': ')
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
        duration: 9000,
        isClosable: true,
      })
    },
  })

  let domains = []
  if (data && data.organization.domains.edges) {
    domains = data.organization.domains.edges.map((e) => e.node)
  }

  if (loading) {
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  }
  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Stack isInline>
          <Link as={ReactRouterLink} to={'/organizations'}>
            <Icon
              alt={i18n._(t`back to organizations`)}
              color="gray.900"
              name="arrow-left"
              fontSize="2xl"
            />
          </Link>
          <Heading as="h1">
            <Trans>{data.organization.name}</Trans>
          </Heading>
        </Stack>
        <Stack direction="row" spacing={4}>
          <Stack spacing={4} flexWrap="wrap">
            <ListOf
              elements={domains}
              ifEmpty={() => <Trans>No domains yet.</Trans>}
            >
              {({ url, lastRan }, index) => (
                <Domain
                  key={'domaindetail' + index}
                  url={url}
                  lastRan={lastRan}
                />
              )}
            </ListOf>
          </Stack>
        </Stack>
      </Stack>
    </Layout>
  )
}
