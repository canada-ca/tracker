import React from 'react'
import { useQuery } from '@apollo/react-hooks'
import { t, Trans } from '@lingui/macro'
import { Layout } from './Layout'
import {
  Link,
  Icon,
  Heading,
  Stack,
  useToast,
  Divider,
  Text,
} from '@chakra-ui/core'
import { ORGANIZATION_BY_SLUG } from './graphql/queries'
import { useLingui } from '@lingui/react'
import { useUserState } from './UserState'
import { Link as ReactRouterLink, useParams } from 'react-router-dom'
import SummaryTable from './SummaryTable'
import makeSummaryTableData from './makeSummaryTableData'

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

  let domainName = ''
  if (data && data.organization.domains.edges) {
    domainName = data.organization.name
  }

  if (loading) {
    return (
      <p>
        <Trans>Loading...</Trans>
      </p>
    )
  }

  const tableEntries = Math.floor(Math.random() * 20)
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
          <Heading as="h1">
            <Trans>{domainName}</Trans>
          </Heading>
        </Stack>
        <Stack>
          {tableEntries > 0 ? (
            <SummaryTable data={makeSummaryTableData(tableEntries)} />
          ) : (
            <Text fontSize="2xl" fontWeight="bold">
              <Trans>No domains yet.</Trans>
            </Text>
          )}

          <Divider />
        </Stack>
      </Stack>
      <Trans>*All data represented is mocked for demonstration purposes</Trans>
    </Layout>
  )
}
