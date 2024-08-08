import React from 'react'
import { Trans } from '@lingui/macro'

export const mainTourSteps = {
  landingPage: [
    {
      content: (
        <h1>
          <Trans>Welcome!</Trans>
        </h1>
      ),
      placement: 'center',
      target: 'body',
    },
    {
      target: '.summaries',
      content: <Trans>Here you can filter the list of organizations</Trans>,
      disableBeacon: true,
    },
  ],
  organizationsPage: [
    {
      target: '.search-box',
      content: <Trans>You can search for an organization here</Trans>,
      disableBeacon: true,
    },
    {
      target: '.filter',
      content: <Trans>Here you can filter the list of organizations</Trans>,
      disableBeacon: true,
    },
    {
      target: '.filterVerified',
      content: <Trans>Here you can filter the list of organizations to only show verified organizations</Trans>,
      disableBeacon: true,
    },
    {
      target: '.organization-card',
      content: <Trans>Here is the information for each organization</Trans>,
      disableBeacon: true,
    },
  ],
  domainPage: [
    {
      content: (
        <h1>
          <Trans>This page is dedicated to everything domains</Trans>
        </h1>
      ),
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.filter-box',
      content: <Trans>You can modify the results of the domain list using these filters</Trans>,
      disableBeacon: true,
    },
    {
      target: '.filters',
      content: <Trans>You can filter the list of domains here</Trans>,
      disableBeacon: true,
    },
    {
      target: '.affiliated',
      content: <Trans>This filter will show only domains affiliated with your account</Trans>,
      disableBeacon: true,
    },
    {
      target: '.domain-card',
      content: <Trans>Here is the information for each domain</Trans>,
      disableBeacon: true,
    },
  ],
  myTrackerPage: [
    {
      content: (
        <h1>
          <Trans>This page is dedicated to your personal view of tracker</Trans>
        </h1>
      ),
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.summary',
      content: <Trans>Summary of your tracker</Trans>,
      disableBeacon: true,
    },
    {
      target: '.dmarc-phases',
      content: <Trans>dmarc phases information</Trans>,
      disableBeacon: true,
    },
    {
      target: '.domains',
      content: <Trans>domains information</Trans>,
      disableBeacon: true,
    },
    {
      target: '.https-config-summary',
      content: <Trans>https configuration summary</Trans>,
      disableBeacon: true,
    },
    {
      target: '.dmarc-phases-other',
      content: <Trans>dmarc phases information</Trans>,
      disableBeacon: true,
    },
  ],
  dmarcSummariesPage: [
    {
      target: '.month-select',
      content: <Trans>Choose the period of data to view</Trans>,
      disableBeacon: true,
    },
    {
      target: '.filter-switch',
      content: <Trans>Filter the data to view</Trans>,
      disableBeacon: true,
    },
    {
      target: '.export-button',
      content: <Trans>Button to export the data</Trans>,
      disableBeacon: true,
    },
    {
      target: '.search-bar',
      content: <Trans>Search for a specific domain</Trans>,
      disableBeacon: true,
    },
  ],
  adminProfilePage: [
    {
      content: (
        <h1>
          <Trans>Welcome to the Admin Profile page!</Trans>
        </h1>
      ),
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.create-organization-button',
      content: (
        <Trans>This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.</Trans>
      ),
      disableBeacon: true,
    },
    {
      target: '.dropdown',
      content: (
        <Trans>This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.</Trans>
      ),
      disableBeacon: true,
    },
    {
      target: '.super-admin',
      content: (
        <Trans>This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.</Trans>
      ),
      disableBeacon: true,
    },
  ],
}
