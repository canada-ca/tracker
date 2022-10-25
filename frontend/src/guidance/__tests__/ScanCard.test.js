import React from 'react'
import { theme, ChakraProvider, Text } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { ScanCard } from '../ScanCard'

import { UserVarProvider } from '../../utilities/userState'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
  })),
})

describe('<ScanCard />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <ScanCard
                  title="HTTPS"
                  description="Testing scan card description"
                >
                  <Text>This is the children area - rendered in ScanCard</Text>
                </ScanCard>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(getByText(/Testing scan card description/i)).toBeInTheDocument()
    expect(
      getByText(/This is the children area - rendered in ScanCard/i),
    ).toBeInTheDocument()
  })
})
