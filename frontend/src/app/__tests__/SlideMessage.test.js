import React from 'react'
import { theme, ChakraProvider } from '@chakra-ui/react'
import { cleanup, render } from '@testing-library/react'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { MockedProvider } from '@apollo/client/testing'
import { MemoryRouter } from 'react-router-dom'
import { makeVar } from '@apollo/client'

import { SlideMessage } from '../SlideMessage'

import { UserVarProvider } from '../../utilities/userState'

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: {},
  },
})

describe('<SlideMessage />', () => {
  afterEach(cleanup)

  it('renders using the in (isOpen) prop correctly', () => {
    const { getByText } = render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <ChakraProvider theme={theme}>
            <MemoryRouter initialEntries={['/']}>
              <I18nProvider i18n={i18n}>
                <SlideMessage in={true} />
              </I18nProvider>
            </MemoryRouter>
          </ChakraProvider>
        </UserVarProvider>
      </MockedProvider>,
    )
    expect(getByText('Track Digital Security'))
  })
})
