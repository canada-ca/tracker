import React from 'react'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'

import { Doughnut, Segment } from '../Doughnut'

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
    { count: 1, title: 'good', color: '#00ff00', percentage: 1, total: 3 },
    { count: 1, title: 'bad', color: '#ff0000', percentage: 1, total: 3 },
    { count: 1, title: 'ugly', color: '#0000ff', percentage: 1, total: 3 },
  ]
  it('renders segments for the data provided', () => {
    const { queryAllByTestId } = render(
      <I18nProvider i18n={i18n}>
        <Doughnut
          id="web"
          title="doughnut chart!"
          data={data}
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
