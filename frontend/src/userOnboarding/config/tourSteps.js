import React from 'react'
import { Trans } from '@lingui/macro'

//Tour steps for each page labeled by the page name, with option for requiring authentication
export const mainTourSteps = {
  organizationsPage: {
    requiresAuth: true,
    steps: [
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
        target: '.filter-verified',
        content: <Trans>Here you can filter the list of organizations to only show verified organizations</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filter-affiliated',
        content: <Trans>Here you can filter the list to only display your affiliated organizations.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.organization-card',
        content: <Trans>Here is the information for each organization</Trans>,
        disableBeacon: true,
      },
      {
        target: '.unclaimed-card',
        content: <Trans>Find domains that potentially belong to your organization here.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  domainPage: {
    requiresAuth: true,
    steps: [
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
        target: '.search-box',
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
      {
        target: '.glossary-button',
        content: <Trans>Click here for additional information on statuses, tags, and filters.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  myTrackerPage: {
    requiresAuth: true,
    steps: [
      {
        content: (
          <h1>
            <Trans>
              This page is dedicated to your personal view of tracker. All domains marked as "favourite" will be
              displayed in the metrics.
            </Trans>
          </h1>
        ),
        placement: 'center',
        target: 'body',
        disableBeacon: true,
      },
      {
        target: '.summary',
        content: <Trans>This tab displays the HTTPS and DMARC summaries for your favourited domains.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.domains',
        content: <Trans>This tab displays a list of your favourited domains.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  dmarcSummariesPage: {
    requiresAuth: true,
    steps: [
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
  },
  adminProfilePage: {
    requiresAuth: true,
    steps: [
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
        target: '.dropdown',
        content: <Trans>If you are an admin of your organization, you can find it here</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-domains-tab',
        content: <Trans>This tab allows you to view and modify your domain list.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-users-tab',
        content: <Trans>This tab allows you to view and modify your organization's affiliated user roles.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-activity-tab',
        content: <Trans>This tab allows you to view event logs of privileged activity in your organization.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  landingPage: {
    requiresAuth: false,
    steps: [
      {
        target: '.create-account-button',
        content: (
          <Trans>
            Create your free account to unlock visibility into your organization's digital footprint. Upon signing up,
            you'll gain access to a dynamic inventory of web infrastructure under your management.
          </Trans>
        ),
        disableBeacon: true,
      },
      {
        target: '.organizations-page-button',
        content: (
          <Trans>
            Check if your organization is already included in our monitored list. If not, you can create a free account
            to access an overview of your organization's digital footprint and potential vulnerabilities.
          </Trans>
        ),
        disableBeacon: true,
      },
      {
        target: '.guidance-button',
        content: <Trans>Click here for guidance on getting started with Tracker and frequently asked questions.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.contact-us-button',
        content: <Trans>Reach out to us if you have any questions.</Trans>,
        disableBeacon: true,
      },
    ],
  },
}
