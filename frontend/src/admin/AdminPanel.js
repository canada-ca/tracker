import React from 'react'
import { Stack, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'
import { string } from 'prop-types'
import { ErrorBoundary } from 'react-error-boundary'

import { AdminDomains } from './AdminDomains'
import { UserList } from './UserList'

import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { AuditLogTable } from './AuditLogTable'
import { ABTestingWrapper } from '../app/ABTestWrapper'
import { ABTestVariant } from '../app/ABTestVariant'

export function AdminPanel({ activeMenu, orgSlug, permission, orgId }) {
  return (
    <Stack spacing={10}>
      <Tabs isFitted variant="enclosed-colored">
        <TabList mb="2">
          <Tab borderTopWidth="4px">
            <Trans>Domains</Trans>
          </Tab>
          <Tab borderTopWidth="4px">
            <Trans>Users</Trans>
          </Tab>
          <ABTestingWrapper insiderVariantName="B">
            <ABTestVariant name="B">
              <Tab borderTopWidth="4px">
                <Trans>Activity</Trans>
              </Tab>
            </ABTestVariant>
          </ABTestingWrapper>
        </TabList>

        <TabPanels>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <AdminDomains permission={permission} orgSlug={orgSlug} domainsPerPage={10} orgId={orgId} />
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <UserList
                filterPending={true}
                activeMenu={activeMenu}
                permission={permission}
                orgSlug={orgSlug}
                usersPerPage={10}
                orgId={orgId}
              />
              {/* <UserList
                filterPending={true}
                activeMenu={activeMenu}
                permission={permission}
                orgSlug={orgSlug}
                usersPerPage={10}
                orgId={orgId}
              /> */}
            </ErrorBoundary>
          </TabPanel>
          <TabPanel>
            <ABTestingWrapper insiderVariantName="B">
              <ABTestVariant name="B">
                <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
                  <AuditLogTable orgId={orgId} />
                </ErrorBoundary>
              </ABTestVariant>
            </ABTestingWrapper>
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
