import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { I18nProvider } from '@lingui/react'
import { MockedProvider } from '@apollo/client/testing'
import { UserCard } from '../UserCard'
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

describe('<UserCard />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <MemoryRouter initialEntries={['/']}>
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <UserCard
                userName="testuser@testemail.gc.ca"
                displayName="Some Test User"
                role="USER"
              />
            </I18nProvider>
          </ChakraProvider>
        </MemoryRouter>
      </MockedProvider>,
    )

    await waitFor(() => {
      expect(getByText(/testuser@testemail.gc.ca/)).toBeInTheDocument()
    })
  })
})
