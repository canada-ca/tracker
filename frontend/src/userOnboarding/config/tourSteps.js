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
