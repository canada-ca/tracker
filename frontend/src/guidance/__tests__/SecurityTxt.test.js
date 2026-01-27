// frontend/src/guidance/SecurityTxt.test.js
import React from 'react'
import { render } from '@testing-library/react'
import { SecurityTxt } from '../SecurityTxt'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})
describe('SecurityTxt', () => {
  it('renders error message when data is undefined', () => {
    const { getByText } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt />
      </I18nProvider>,
    )
    expect(getByText('Data not available for this service. Try rescanning or come back later.')).toBeInTheDocument()
  })

  it('renders error message when data is an empty array', () => {
    const { getByText } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt data={[]} />
      </I18nProvider>,
    )
    expect(getByText('Data not available for this service. Try rescanning or come back later.')).toBeInTheDocument()
  })

  it('renders error message when all records have errors', () => {
    const data = [{ error: 'Some error' }, { error: 'Another error' }]
    const { getByText } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt data={data} />
      </I18nProvider>,
    )
    expect(getByText('No record was found for this service.')).toBeInTheDocument()
  })

  it('renders security.txt content when valid record exists', async () => {
    const data = [{ raw: 'Contact: mailto:security@example.com' }, { error: 'Some error' }]
    const { getByText } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt data={data} />
      </I18nProvider>,
    )
    expect(getByText('Security.txt')).toBeInTheDocument()
    // await waitFor(() => expect(getByText('Contact: mailto:security@example.com')).toBeInTheDocument())
    expect(getByText('Contact: mailto:security@example.com')).toBeInTheDocument()
  })

  it('passes additional props to Box', () => {
    const data = [{ raw: 'Contact: mailto:security@example.com' }]
    const { getByTestId } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt data={data} data-testid="security-txt-box" />
      </I18nProvider>,
    )
    expect(getByTestId('security-txt-box')).toBeInTheDocument()
  })

  it('renders nothing in <Code> if data.raw is undefined', () => {
    const data = [{}]
    const { getByText } = render(
      <I18nProvider i18n={i18n}>
        <SecurityTxt data={data} />
      </I18nProvider>,
    )
    // Should render <Code> with no content
    expect(getByText('Security.txt')).toBeInTheDocument()
    // No error message, so Code is rendered
    expect(getByText('', { selector: 'code' })).toBeInTheDocument()
  })
})
