import React from 'react'
import { render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { SummaryCard } from '../SummaryCard'

const data = [
  {
    strength: 'strong',
    name: 'Fully Implemented',
    categories: [
      {
        name: 'pass_conditon',
        qty: Math.floor(Math.random() * 1000 + 1),
      },
    ],
  },
  {
    strength: 'moderate',
    name: 'Partially Implemented',
    categories: [
      {
        name: 'partial_pass',
        qty: Math.floor(Math.random() * 300 + 1),
      },
    ],
  },
  {
    strength: 'weak',
    name: 'Not Implemented',
    categories: [
      {
        name: 'fail_condition',
        qty: Math.floor(Math.random() * 300 + 1),
      },
    ],
  },
]

describe('<SummaryCard />', () => {
  it('renders correctly', async () => {
    render(
      <I18nProvider i18n={setupI18n()}>
        <ThemeProvider theme={theme}>
          <SummaryCard title="title" description="description" data={data} />
        </ThemeProvider>
      </I18nProvider>,
    )
  })
})
