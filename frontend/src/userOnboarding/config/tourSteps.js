import React from 'react'
import { t, Trans } from '@lingui/macro'

export const mainTourSteps = {
  landingPage: [
    {
      content: <h1>Welcome!</h1>,
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
      content: 'Here you can filter the list of organizations',
      disableBeacon: true,
    },
    {
      target: '.filterVerified',
      content: 'Here you can filter the list of organizations to only show verified organizations',
      disableBeacon: true,
    },
    {
      target: '.organization-card',
      content: 'Here is the information for each organization',
      disableBeacon: true,
    },
  ],
  domainPage: [
    {
      content: <h1>This page is dedicated to everything domains</h1>,
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.filter-box',
      content: 'You can modify the results of the domain list using these filters',
      disableBeacon: true,
    },
    {
      target: '.filters',
      content: 'You can filter the list of domains here',
      disableBeacon: true,
    },
    {
      target: '.affiliated',
      content: 'This filter will show only domains affiliated with your account',
      disableBeacon: true,
    },
    {
      target: '.domain-card',
      content: 'Here is the information for each domain',
      disableBeacon: true,
    },
  ],
  myTrackerPage: [
    {
      content: <h1>This page is dedicated to your personal view of tracker</h1>,
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.summary',
      content: 'Summary of your tracker',
      disableBeacon: true,
    },
    {
      target: '.dmarc-phases',
      content: 'dmarc phases information',
      disableBeacon: true,
    },
    {
      target: '.domains',
      content: 'domains information',
      disableBeacon: true,
    },
    {
      target: '.https-config-summary',
      content: 'https configuration summary',
      disableBeacon: true,
    },
    {
      target: '.dmarc-phases-other',
      content: 'dmarc phases information',
      disableBeacon: true,
    },
  ],
  dmarcSummariesPage: [
    {
      target: '.month-select',
      content: 'Choose the period of data to view',
      disableBeacon: true,
    },
    {
      target: '.filter-switch',
      content: 'Filter the data to view',
      disableBeacon: true,
    },
    {
      target: '.export-button',
      content: 'Button to export the data',
      disableBeacon: true,
    },
    {
      target: '.search-bar',
      content: 'Search for a specific domain',
      disableBeacon: true,
    },
  ],
  adminProfilePage: [
    {
      content: <h1>Welcome to the Admin Profile page!</h1>,
      placement: 'center',
      target: 'body',
      disableBeacon: true,
    },
    {
      target: '.create-organization-button',
      content: 'This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.',
      disableBeacon: true,
    },
    {
      target: '.dropdown',
      content: 'This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.',
      disableBeacon: true,
    },
    {
      target: '.super-admin',
      content: 'This is the Super Admin menu. You can switch between Organizations, Users, and Audit Logs.',
      disableBeacon: true,
    },
  ],
}
