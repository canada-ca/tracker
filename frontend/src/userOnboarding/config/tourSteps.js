import React from 'react'

export const tourSteps = [
  {
    content: <h1>Welcome!</h1>,
    placement: 'center',
    target: 'body',
  },
]

export const orgTourSteps = [
  {
    target: '.search-box',
    content: 'You can search for an organization here',
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
]

export const domainsTourSteps = [
    {
        content: <h1>This page is dedicated to everything domains</h1>,
        placement: 'center',
        target: 'body',
      },
      {
        target: '.filter-box',
        content: 'You can modify the results of the domain list using these filters',
      },
      {
        target: '.filters',
        content: 'You can filter the list of domains here',
      },
      {
        target: '.affiliated',
        content: 'This filter will show only domains affiliated with your account',
      },
      {
        target: '.domain-card',
        content: 'Here is the information for each domain',
      },
]

export const myTrackerTourSteps = [
    {
        content: <h1>This page is dedicated to your personal view of tracker</h1>,
        placement: 'center',
        target: 'body',
      },
      {
        target: '.summary',
        content: 'Summary of your tracker',
      },
      {
        target: '.dmarc-phases',
        content: 'dmarc phases information',
      },
      {
        target: '.domains',
        content: 'domains information',
      },
      {
        target: '.https-config-summary',
        content: 'https configuration summary',
      },
      {
        target: '.dmarc-phases-other',
        content: 'dmarc phases information',
      },
]