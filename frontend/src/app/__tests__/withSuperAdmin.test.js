import React from 'react'
import { render } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import withSuperAdmin from '../withSuperAdmin'
import { IS_USER_SUPER_ADMIN } from '../../graphql/queries'
import { I18nProvider } from '@lingui/react'
import { setupI18n } from '@lingui/core'
import { en } from 'make-plural/plurals'
import { UserVarProvider } from '../../utilities/userState'
import { makeVar } from '@apollo/client'

// Mock component to wrap with the HOC
const MockComponent = () => <div>Mock Component</div>

// Mocked responses for the GraphQL query
const mocks = [
  {
    request: {
      query: IS_USER_SUPER_ADMIN,
    },
    result: {
      data: {
        isUserSuperAdmin: true,
      },
    },
  },
  {
    request: {
      query: IS_USER_SUPER_ADMIN,
    },
    result: {
      data: {
        isUserSuperAdmin: false,
      },
    },
  },
]

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {},
  },
  localeData: {
    en: { plurals: en },
  },
})

describe('withSuperAdmin', () => {
  it('renders the component if the user is a super admin', async () => {
    const SuperAdminComponent = withSuperAdmin(MockComponent)
    const { findByText } = render(
      <MockedProvider mocks={[mocks[0]]} addTypename={false}>
        <I18nProvider i18n={i18n}>
          <UserVarProvider userVar={makeVar({ jwt: 'jwt', tfaSendMethod: 'email', userName: 'test.user@gc.ca' })}>
            <SuperAdminComponent />
          </UserVarProvider>
        </I18nProvider>
      </MockedProvider>,
    )

    expect(await findByText('Mock Component')).toBeInTheDocument()
  })

  it('does not render the component if the user is not a super admin', async () => {
    const SuperAdminComponent = withSuperAdmin(MockComponent)
    const { queryByText } = render(
      <MockedProvider mocks={[mocks[1]]} addTypename={false}>
        <I18nProvider i18n={i18n}>
          <SuperAdminComponent />
        </I18nProvider>{' '}
      </MockedProvider>,
    )

    expect(queryByText('Mock Component')).not.toBeInTheDocument()
  })
})
