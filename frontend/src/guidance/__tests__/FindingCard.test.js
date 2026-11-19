import React from 'react'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { ChakraProvider, theme } from '@chakra-ui/react'

import { FindingCard } from '../FindingCard'

const baseFinding = {
  subject: 'app.example.ca',
  source: 'subdomain-takeover',
  findingType: 'subdomain-takeover-cname',
  confidence: 'confirmed',
  reasonCode: 'NXDOMAIN_TARGET',
  firstSeen: '2024-01-01T12:00:00.000Z',
  lastSeen: '2024-02-03T12:00:00.000Z',
  evidence: { recordType: 'CNAME', target: 'ghost.example.net' },
  attributes: {},
}

const renderCard = (overrides = {}) =>
  render(
    <ChakraProvider theme={theme}>
      <I18nProvider i18n={i18n}>
        <FindingCard {...baseFinding} {...overrides} />
      </I18nProvider>
    </ChakraProvider>,
  )

const formatTimestamp = (ts) => new Date(ts).toLocaleString('en-CA', { timeZoneName: 'short' })

describe('<FindingCard />', () => {
  describe('heading', () => {
    it.each([
      { findingType: 'subdomain-takeover-cname', label: 'Dangling CNAME' },
      { findingType: 'subdomain-takeover-ns', label: 'Lame Delegation (Sitting Duck)' },
    ])('shows "$label" for $findingType', ({ findingType, label }) => {
      renderCard({ findingType })

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(label)
    })

    it('shows the raw finding type when it is unknown', () => {
      renderCard({ findingType: 'brand-new-type' })

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('brand-new-type')
    })
  })

  it('shows the source as a badge in the header', () => {
    renderCard()

    expect(screen.getByText('subdomain-takeover', { selector: 'span' })).toBeInTheDocument()
  })

  describe('confidence', () => {
    it.each([
      { confidence: 'suspected', label: 'Suspected' },
      { confidence: 'probable', label: 'Probable' },
      { confidence: 'confirmed', label: 'Confirmed' },
    ])('labels $confidence as $label', ({ confidence, label }) => {
      renderCard({ confidence })

      expect(screen.getByText(label)).toBeInTheDocument()
    })

    it('shows the raw value for an unknown confidence level', () => {
      renderCard({ confidence: 'maybe' })

      expect(screen.getByText('maybe')).toBeInTheDocument()
    })
  })

  describe('details', () => {
    it('shows the reason code in monospace', () => {
      renderCard()

      expect(getComputedStyle(screen.getByText('NXDOMAIN_TARGET')).fontFamily).toBe('var(--chakra-fonts-mono)')
    })

    it('shows the first and last seen timestamps', () => {
      renderCard()

      expect(screen.getByText(formatTimestamp(baseFinding.firstSeen))).toBeInTheDocument()
      expect(screen.getByText(formatTimestamp(baseFinding.lastSeen))).toBeInTheDocument()
    })

    it('explains the finding from its evidence', () => {
      renderCard()

      expect(screen.getByText(/app\.example\.ca is a CNAME pointing to ghost\.example\.net/)).toBeInTheDocument()
    })
  })

  describe('recommended action', () => {
    it.each(['subdomain-takeover-cname', 'subdomain-takeover-ns'])('is shown for the known type %s', (findingType) => {
      renderCard({ findingType })

      expect(screen.getByText('Recommended action')).toBeInTheDocument()
    })

    it('is absent for an unknown finding type', () => {
      renderCard({ findingType: 'brand-new-type' })

      expect(screen.queryByText('Recommended action')).not.toBeInTheDocument()
    })
  })
})
