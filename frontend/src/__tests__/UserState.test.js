import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'

import { UserStateProvider, UserState, useUserState } from '../UserState'

describe('useUserState()', () => {
  it('provides the UserState context via a Hook', async () => {
    let userState
    function Foo() {
      const state = useUserState()
      userState = state
      return <p>asdf</p>
    }

    render(
      <UserStateProvider
        initialState={{
          userName: null,
          jwt: null,
          tfa: null,
        }}
      >
        <Foo />
      </UserStateProvider>,
    )
    await waitFor(() =>
      expect(userState).toMatchObject({
        currentUser: { jwt: null, tfa: null, userName: null },
        isLoggedIn: expect.any(Function),
        login: expect.any(Function),
        logout: expect.any(Function),
      }),
    )
  })
})

describe('<UserStateProvider/>', () => {
  describe('given an initial state', () => {
    let initialState
    beforeEach(() => {
      initialState = {
        userName: null,
        jwt: null,
        tfa: null,
      }
    })

    it('sets the currentUser and supplies functions to change user state', () => {
      let providedState

      render(
        <UserStateProvider initialState={initialState}>
          <UserState>
            {(value) => {
              providedState = value
              return <p>{value.currentUser.userName}</p>
            }}
          </UserState>
        </UserStateProvider>,
      )
      expect(providedState).toMatchObject({
        currentUser: { jwt: null, tfa: null, userName: null },
        isLoggedIn: expect.any(Function),
        login: expect.any(Function),
        logout: expect.any(Function),
      })
    })

    describe('state altering functions', () => {
      describe('login()', () => {
        it('sets the currentUser to the values provided', async () => {
          const testUser = {
            jwt: 'string',
            tfa: true,
            userName: 'foo@example.com',
          }

          const { getByTestId } = render(
            <UserStateProvider initialState={initialState}>
              <UserState>
                {({ currentUser, login }) => {
                  return (
                    <div>
                      <p data-testid="username">{currentUser.userName}</p>
                      <button
                        data-testid="loginbutton"
                        onClick={() => login(testUser)}
                      />
                    </div>
                  )
                }}
              </UserState>
            </UserStateProvider>,
          )

          fireEvent.click(getByTestId('loginbutton'))

          await waitFor(() => {
            expect(getByTestId('username').innerHTML).toEqual('foo@example.com')
          })
        })
      })
      describe('logout()', () => {
        it('sets the currentUser to initialState', async () => {
          let currentUser, login, logout

          const testUser = {
            jwt: 'string',
            tfa: true,
            userName: 'foo@example.com',
          }

          render(
            <UserStateProvider initialState={initialState}>
              <UserState>
                {(state) => {
                  const { currentUser: cu, login: li, logout: lo } = state
                  currentUser = cu
                  login = li
                  logout = lo
                  return <p data-testid="username">{cu.userName}</p>
                }}
              </UserState>
            </UserStateProvider>,
          )

          await waitFor(() => login(testUser))

          await waitFor(() => {
            expect(currentUser).toMatchObject(testUser)
          })

          await waitFor(() => logout())

          await waitFor(() => {
            expect(currentUser).toMatchObject(initialState)
          })
        })
      })
      describe('isLoggedIn()', () => {
        it('returns true if currentUser object values differ from initialState', async () => {
          const testUser = {
            jwt: 'string',
            tfa: true,
            userName: 'foo@example.com',
          }

          let isLoggedIn, login

          render(
            <UserStateProvider initialState={initialState}>
              <UserState>
                {(state) => {
                  const { isLoggedIn: ili, login: li } = state
                  isLoggedIn = ili
                  login = li
                  return (
                    <p data-testid="username">{state.currentUser.userName}</p>
                  )
                }}
              </UserState>
            </UserStateProvider>,
          )

          await waitFor(() => login(testUser))

          await waitFor(() => {
            expect(isLoggedIn()).toEqual(true)
          })
        })

        it('returns false if currentUser object values match initialState', async () => {
          const testUser = {
            jwt: 'string',
            tfa: true,
            userName: 'foo@example.com',
          }

          let isLoggedIn, logout, login

          render(
            <UserStateProvider initialState={initialState}>
              <UserState>
                {(state) => {
                  const { isLoggedIn: ili, login: li, logout: lo } = state
                  isLoggedIn = ili
                  login = li
                  logout = lo
                  return (
                    <p data-testid="username">{state.currentUser.userName}</p>
                  )
                }}
              </UserState>
            </UserStateProvider>,
          )

          await waitFor(() => login(testUser))
          await waitFor(() => logout())

          await waitFor(() => {
            expect(isLoggedIn()).toEqual(false)
          })
        })
      })
    })
  })
})
