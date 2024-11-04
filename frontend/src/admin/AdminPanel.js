import React from 'react'
import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { ErrorBoundary } from 'react-error-boundary'

import { AdminDomains } from './AdminDomains'
import { UserList } from './UserList'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { AuditLogTable } from './AuditLogTable'

export function AdminPanel({ activeMenu, orgSlug, permission, orgId }) {
  return (
    <Stack spacing={10}>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="2">
          <Tab borderTopWidth="4px" className="admin-domains-tab">
            <Trans>Domains</Trans>
          </Tab>
          <Tab borderTopWidth="4px" className="admin-users-tab">
            <Trans>Users</Trans>
          </Tab>
          <Tab borderTopWidth="4px" className="admin-activity-tab">
            <Trans>Activity</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <AdminDomains orgSlug={orgSlug} orgId={orgId} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <UserList
                includePending={true}
                activeMenu={activeMenu}
                permission={permission}
                orgSlug={orgSlug}
                orgId={orgId}
              />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <AuditLogTable orgId={orgId} />
            </ErrorBoundary>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Stack>
  )
}

AdminPanel.propTypes = {
  activeMenu: string,
  orgSlug: string.isRequired,
  permission: string.isRequired,
  orgId: string,
}
