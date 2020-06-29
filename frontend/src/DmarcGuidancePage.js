import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { FIND_DOMAIN_BY_SLUG } from './graphql/queries'
import { Stack, Text } from '@chakra-ui/core'
import { string } from 'prop-types'

export function DmarcGuidancePage({ match }) {
  const { currentUser } = useUserState()
  const {
    params: { urlSlug },
  } = match

  const { loading, error, data } = useQuery(FIND_DOMAIN_BY_SLUG, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      urlSlug: urlSlug,
    },
  })

  if (loading) return <p>Loading</p>
  if (error) return <p>Error</p>

  const httpsTags =
    data.findDomainBySlug.web.edges[0].node.https.httpsGuidanceTags
  const sslTags = data.findDomainBySlug.web.edges[0].node.ssl.sslGuidanceTags

  const dmarcTags =
    data.findDomainBySlug.email.edges[0].node.dmarc.dmarcGuidanceTags
  const spfTags = data.findDomainBySlug.email.edges[0].node.spf.spfGuidanceTags
  const dkimTags =
    data.findDomainBySlug.email.edges[0].node.dkim.dkimGuidanceTags

  return (
    <Stack>
      <Text as="b">WEB</Text>
      <Text as="b">https</Text>
      <Text>{httpsTags}</Text>
      <Text as="b">ssl</Text>
      <Text>{sslTags}</Text>
      <Text as="B">EMAIL</Text>
      <Text as="b">dmarc</Text>
      <Text>{dmarcTags}</Text>
      <Text as="b">spf</Text>
      <Text>{spfTags}</Text>
      <Text as="b">dkim</Text>
      <Text>{dkimTags}</Text>
    </Stack>
  )
}

DmarcGuidancePage.propTypes = {
  match: {
    params: {
      urlSlug: string,
    },
  },
}
