import React from 'react'
import { Divider, Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { array, bool, string } from 'prop-types'
import { ErrorBoundary } from 'react-error-boundary'

import { AdminDomains } from './AdminDomains'
import { UserList } from './UserList'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { AuditLogTable } from './AuditLogTable'
import { TourComponent } from '../userOnboarding/components/TourComponent'
import { DomainTagsList } from './DomainTagsList'

export function AdminPanel({ activeMenu, orgSlug, permission, orgId, verified, availableTags }) {
  return (
    <Stack spacing={10}>
      <TourComponent />
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="2">
          <Tab borderTopWidth="4px" className="admin-domains-tab">
            <Trans>Domains</Trans>
          </Tab>
          <Tab borderTopWidth="4px" className="admin-users-tab">
            <Trans>Users</Trans>
          </Tab>
          <Tab borderTopWidth="4px" className="admin-activity-tab">
            <Trans>Tags</Trans>
          </Tab>
          <Tab borderTopWidth="4px" className="admin-activity-tab">
            <Trans>Activity</Trans>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <AdminDomains
                orgSlug={orgSlug}
                orgId={orgId}
                verified={verified}
                permission={permission}
                availableTags={availableTags}
              />
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
              <Divider borderColor="gray.50" />
              <DomainTagsList orgId={orgId} />
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
  availableTags: array,
  orgId: string,
  verified: bool,
}
