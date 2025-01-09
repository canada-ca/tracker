import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { makeVar } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { en } from 'make-plural/plurals'

import { PrivatePage } from '../PrivatePage'

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

describe('<PrivatePage />', () => {
  describe('when a userName is defined', () => {
    it(`executes its child as a function`, async () => {
      const { queryAllByText } = render(
        <I18nProvider i18n={i18n}>
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                userName: 'asdf',
                emailValidated: true,
              })}
            >
              <MemoryRouter initialEntries={['/']}>
                <PrivatePage isLoginRequired={true} path="/">
                  {() => <p>foo</p>}
                </PrivatePage>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(1)
    })
  })

  describe('when userName is falsy', () => {
    it(`executes its child as a function`, async () => {
      const { queryAllByText } = render(
        <I18nProvider i18n={i18n}>
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                userName: undefined,
                emailValidated: undefined,
              })}
            >
              <MemoryRouter initialEntries={['/organizations/foo']}>
                <PrivatePage isLoginRequired={true} path="/organizations/:orgSlug" title={'foo'} exact>
                  {({ match }) => <p>{match.params.orgSlug}</p>}
                </PrivatePage>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(0)
    })
  })

  describe('when a userName is defined', () => {
    it(`passes props to the child`, async () => {
      const { queryAllByText } = render(
        <I18nProvider i18n={i18n}>
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                userName: 'asdf',
                emailValidated: true,
              })}
            >
              <MemoryRouter initialEntries={['/organizations/foo']}>
                <PrivatePage isLoginRequired={true} path="/organizations/:orgSlug" title={'foo'} exact>
                  {({ match }) => <p>{match.params.orgSlug}</p>}
                </PrivatePage>
              </MemoryRouter>
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(1)
    })
  })
})
