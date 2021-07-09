import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { TopBanner } from '../TopBanner'
import { cleanup, render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { UserVarProvider } from '../UserState'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<TopBanner />', () => {
  afterEach(cleanup)

  it('renders using the language prop correctly', () => {
    const { getByAltText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <TopBanner lang="en" />
              </I18nProvider>
            </MemoryRouter>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(getByAltText('Symbol of the Government of Canada'))
  })
})
