import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PrivatePage from '../PrivatePage'
import { UserVarProvider } from '../UserState'
import { makeVar } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'

describe('<PrivatePage />', () => {
  describe('when a userName is defined', () => {
    it(`executes its child as a function`, async () => {
      const { queryAllByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              userName: 'asdf',
            })}
          >
            <MemoryRouter initialEntries={['/']}>
              <PrivatePage path="/">{() => <p>foo</p>}</PrivatePage>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(1)
    })
  })
})

describe('<PrivatePage />', () => {
  describe('when userName is falsy', () => {
    it(`executes its child as a function`, async () => {
      const { queryAllByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              userName: undefined,
            })}
          >
            <MemoryRouter initialEntries={['/organizations/foo']}>
              <PrivatePage path="/organizations/:orgSlug" title={'foo'} exact>
                {({ match }) => <p>{match.params.orgSlug}</p>}
              </PrivatePage>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(0)
    })
  })
})

describe('<PrivatePage />', () => {
  describe('when a userName is defined', () => {
    it(`passes props to the child`, async () => {
      const { queryAllByText } = render(
        <MockedProvider>
          <UserVarProvider
            userVar={makeVar({
              userName: 'asdf',
            })}
          >
            <MemoryRouter initialEntries={['/organizations/foo']}>
              <PrivatePage path="/organizations/:orgSlug" title={'foo'} exact>
                {({ match }) => <p>{match.params.orgSlug}</p>}
              </PrivatePage>
            </MemoryRouter>
          </UserVarProvider>
        </MockedProvider>,
      )

      expect(queryAllByText('foo')).toHaveLength(1)
    })
  })
})
