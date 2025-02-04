import React from 'react'
import { Trans } from '@lingui/macro'

//Tour steps for each page labeled by the page name, with option for requiring authentication
export const mainTourSteps = {
  organizationsPage: {
    steps: [
      {
        target: '.search-box',
        content: <Trans>Use this search box to find an organization.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filter',
        content: <Trans>Apply filters to refine the organization list.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filter-verified',
        content: <Trans>Filter the list to display only verified organizations.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filter-affiliated',
        content: <Trans>Filter the list to show your affiliated organizations.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.organization-card',
        content: <Trans>Click an organization card to view more details.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.request-invite-button',
        content: <Trans>Request an invite if you are unaffiliated with your organization.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.unclaimed-card',
        content: <Trans>Find domains that potentially belong to your organization.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  organizationSummary: {
    steps: [
      {
        target: '.summaries-group',
        content: <Trans>View summaries of your organization's web and email security compliance.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.progress-graph',
        content: <Trans>Monitor changes in your organization's security compliance over time.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.aggregated-guidance-summary',
        content: <Trans>Identify your organization's most common security issues.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  organizationDomains: {
    steps: [
      {
        target: '.search-box',
        content: <Trans>Search for domains here.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.domain-filters',
        content: <Trans>Apply filters to refine your domain search results.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.domain-card',
        content: <Trans>View high-level details for each domain.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.asset-state',
        content: (
          <Trans>
            The asset state shows the domain's relation to your organization. Only "approved" assets are counted in
            summaries.
          </Trans>
        ),
        disableBeacon: true,
      },
      {
        target: '.system-tags',
        content: <Trans>System-designated tags appear here.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.user-tags',
        content: <Trans>User-designated tags appear here.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.view-results-button',
        content: <Trans>Click to view detailed scan results and guidance.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.request-scan-button',
        content: <Trans>Refresh the web and email scan results for this domain.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.favourite-button',
        content: <Trans>Mark domains as "Favourite" to save them to your "myTracker" page.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  domainPage: {
    steps: [
      {
        target: '.search-box',
        content: <Trans>Use these filters to modify the domain list results.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filters',
        content: <Trans>Filter the list of domains here.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.affiliated',
        content: <Trans>This filter will show only domains affiliated with your account.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.domain-card',
        content: <Trans>View information for each domain.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.glossary-button',
        content: <Trans>Click for additional information on statuses, tags, and filters.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  myTrackerPage: {
    steps: [
      {
        content: (
          <h1>
            <Trans>
              This page displays your personal view of tracked domains. All domains marked as "favourite" will be shown
              in the metrics.
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
    steps: [
      {
        target: '.month-select',
        content: <Trans>Select the data period to view.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.search-bar',
        content: <Trans>Search for a specific domain.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.info-button',
        content: <Trans>Open the glossary.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.filter-switch',
        content: <Trans>Use filters to refine your search.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  adminProfilePage: {
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
        content: <Trans>If you are an admin, you can find your organization here.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-domains-tab',
        content: <Trans>View and modify your domain list.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-users-tab',
        content: <Trans>View and modify your organization's affiliated user roles.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.admin-activity-tab',
        content: <Trans>View event logs of privileged activity in your organization.</Trans>,
        disableBeacon: true,
      },
    ],
  },
  landingPage: {
    steps: [
      {
        target: '.create-account-button',
        content: (
          <Trans>
            Create a free account to gain visibility into your organization's digital footprint and access a dynamic
            inventory of your web infrastructure.
          </Trans>
        ),
        disableBeacon: true,
      },
      {
        target: '.organizations-page-button',
        content: (
          <Trans>
            Check if your organization is already included. If not, create a free account to access an overview of your
            organization's digital footprint and potential vulnerabilities.
          </Trans>
        ),
        disableBeacon: true,
      },
      {
        target: '.guidance-button',
        content: <Trans>Click for guidance on getting started with Tracker and frequently asked questions.</Trans>,
        disableBeacon: true,
      },
      {
        target: '.contact-us-button',
        content: <Trans>Reach out if you have any questions.</Trans>,
        disableBeacon: true,
      },
    ],
  },
}
