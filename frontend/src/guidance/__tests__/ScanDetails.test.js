import React from 'react'
import { theme, Accordion, ChakraProvider, Text } from '@chakra-ui/react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import { en } from 'make-plural/plurals'

import { ScanDetails } from '../ScanDetails'

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

describe('<ScanDetails />', () => {
  it('renders', async () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <I18nProvider i18n={i18n}>
              <MemoryRouter initialEntries={['/']} initialIndex={0}>
                <Accordion>
                  <ScanDetails title="ScanTitle">
                    <Text>This is a test for ScanDetails children</Text>
                  </ScanDetails>
                </Accordion>
              </MemoryRouter>
            </I18nProvider>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(getByText(/ScanTitle/i)).toBeInTheDocument()
    expect(
      getByText(/This is a test For ScanDetails children/i),
    ).toBeInTheDocument()
  })
})
