import React from 'react'
import { render } from '@testing-library/react'
import { Doughnut, Segment } from '../Doughnut'
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

describe('<Doughnut/>', () => {
  const data = [
    { count: 1, title: 'good', percentage: 1, total: 3 },
    { count: 1, title: 'bad', percentage: 1, total: 3 },
    { count: 1, title: 'ugly', percentage: 1, total: 3 },
  ]
  it('renders segments for the data provided', () => {
    const { queryAllByTestId } = render(
      <I18nProvider i18n={i18n}>
        <Doughnut
          title="doughnut chart!"
          data={data}
          color="#2e2e40"
          height={320}
          width={320}
          valueAccessor={(d) => d.count}
          data-testid="doughnut"
        >
          {(segmentProps, index) => (
            <Segment
              data-testid="segment"
              key={`segment:${index}`}
              {...segmentProps}
            />
          )}
        </Doughnut>
      </I18nProvider>,
    )

    const segments = queryAllByTestId('segment')
    expect(segments).toHaveLength(3)
  })
})
