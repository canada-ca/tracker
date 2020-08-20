import React from 'react'
import { useQuery } from '@apollo/client'
import { t, Trans } from '@lingui/macro'
import { Layout } from './Layout'
import {
  IconButton,
  Heading,
  Stack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/core'
import { ORG_DETAILS_PAGE } from './graphql/queries'
import { useLingui } from '@lingui/react'
import { useUserState } from './UserState'
import { useParams, useHistory } from 'react-router-dom'
import DomainsPage from './DomainsPage'
import UserList from './UserList'

export default function OrganizationDetails() {
  const { i18n } = useLingui()
  const { orgSlug } = useParams()
  const { currentUser } = useUserState()
  const toast = useToast()
  const history = useHistory()
  const { loading, _error, data } = useQuery(ORG_DETAILS_PAGE, {
    variables: { slug: orgSlug, orgSlug: orgSlug },
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    onError: error => {
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

  let orgName = ''
  if (data && data.organization.domains.edges) {
    orgName = data.organization.name
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
      <Stack isInline align="center" mb="4">
        <IconButton
          icon="arrow-left"
          onClick={history.goBack}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to organizations"
        />
        <Heading as="h1">
          <Trans>{orgName}</Trans>
        </Heading>
      </Stack>
      <Tabs isFitted>
        <TabList mb="4">
          {/* <Tab>Summary</Tab>  */}
          <Tab>Domains</Tab>
          <Tab>Users</Tab>
        </TabList>

        <TabPanels>
          {/* <TabPanel>summary panel</TabPanel> */}
          <TabPanel>
            <DomainsPage />
          </TabPanel>
          <TabPanel>
            <UserList
              userListData={data.userList}
              orgName={orgName}
              orgSlug={orgSlug}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  )
}
