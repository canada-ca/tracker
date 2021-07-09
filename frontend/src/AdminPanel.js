import React from 'react'
import {
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { AdminDomains } from './AdminDomains'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import UserList from './UserList'

export default function AdminPanel({ orgSlug, permission, orgId }) {
  return (
    <Stack spacing={10}>
      <Tabs isFitted variant="enclosed">
        <TabList mb="2">
          <Tab>
            <Trans>Domains</Trans>
          </Tab>
          <Tab>
            <Trans>Users</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <AdminDomains
                orgSlug={orgSlug}
                domainsPerPage={10}
                orgId={orgId}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <UserList
                permission={permission}
                orgSlug={orgSlug}
                usersPerPage={10}
                orgId={orgId}
              />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  )
}

AdminPanel.propTypes = {
  orgSlug: string.isRequired,
  permission: string.isRequired,
  orgId: string,
}
