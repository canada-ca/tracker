import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { FIND_DOMAIN_BY_SLUG } from './graphql/queries'
import { Stack, Text } from '@chakra-ui/core'
import { string } from 'prop-types'
import { dmarc, spf, dkim, ssl, https } from './GuidanceTagConstants'

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
      {httpsTags.map((tag) => {
        return (
          <Stack isInline>
            <Text>{tag}</Text>
            <Text>{https[tag].tag_name}</Text>
            <Text>{https[tag].guidance}</Text>
          </Stack>
        )
      })}
      <Text as="b">ssl</Text>
      {sslTags.map((tag) => {
        return (
          <Stack isInline>
            <Text>{tag}</Text>
            <Text>{ssl[tag].tag_name}</Text>
            <Text>{ssl[tag].guidance}</Text>
          </Stack>
        )
      })}
      <Text as="B">EMAIL</Text>
      <Text as="b">dmarc</Text>
      {dmarcTags.map((tag) => {
        return (
          <Stack isInline>
            <Text>{tag}</Text>
            <Text>{dmarc[tag].tag_name}</Text>
            <Text>{dmarc[tag].guidance}</Text>
          </Stack>
        )
      })}
      <Text as="b">spf</Text>
      {spfTags.map((tag) => {
        return (
          <Stack isInline>
            <Text>{tag}</Text>
            <Text>{spf[tag].tag_name}</Text>
            <Text>{spf[tag].guidance}</Text>
          </Stack>
        )
      })}
      <Text as="b">dkim</Text>
      {dkimTags.map((tag) => {
        return (
          <Stack isInline>
            <Text>{tag}</Text>
            <Text>{dkim[tag].tag_name}</Text>
            <Text>{dkim[tag].guidance}</Text>
          </Stack>
        )
      })}
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
