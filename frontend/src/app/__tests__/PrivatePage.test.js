import React from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
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
    it('executes its child as a function', async () => {
      const router = createMemoryRouter(
        [
          {
            path: '/sign-in',
            element: <p>sign in</p>,
          },
          {
            path: '/',
            element: <PrivatePage condition={true}>{<p>foo</p>}</PrivatePage>,
          },
        ],
        {
          initialEntries: ['/'],
          initialIndex: 0,
        },
      )

      const { queryByText } = render(
        <I18nProvider i18n={i18n}>
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                userName: 'asdf',
                emailValidated: true,
              })}
            >
              <RouterProvider router={router} />
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>,
      )

      expect(queryByText('foo')).toBeInTheDocument()
    })
  })

  describe('when userName is falsy', () => {
    it('redirects to the sign-in page', async () => {
      const router = createMemoryRouter(
        [
          {
            path: '/sign-in',
            element: <p>sign in</p>,
          },
          {
            path: '/organizations/:orgSlug',
            element: <PrivatePage condition={false}>{({ match }) => <p>{match.params.orgSlug}</p>}</PrivatePage>,
          },
        ],
        {
          initialEntries: ['/organizations/foo'],
          initialIndex: 0,
        },
      )

      const { queryByText } = render(
        <I18nProvider i18n={i18n}>
          <MockedProvider>
            <UserVarProvider
              userVar={makeVar({
                userName: undefined,
                emailValidated: undefined,
              })}
            >
              <RouterProvider router={router} />
            </UserVarProvider>
          </MockedProvider>
        </I18nProvider>,
      )

      expect(queryByText('foo')).not.toBeInTheDocument()
    })
  })
})
