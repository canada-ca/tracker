import React, { useState } from 'react'
import { render, waitFor } from '@testing-library/react'
import { UserVarProvider, useUserVar } from '../UserState'
import { MockedProvider } from '@apollo/client/testing'
import { makeVar } from '@apollo/client'
import userEvent from '@testing-library/user-event'

const UserStateExample = () => {
  const { login, logout, currentUser, isLoggedIn } = useUserVar()
  const [newJWT, setNewJWT] = useState('')

  const newJWTHandler = (e) => {
    setNewJWT(e.target.value)
  }
  return (
    <div>
      <p>Current JWT: {currentUser.jwt}</p>
      <p>Is logged in: {isLoggedIn().toString()}</p>

      <label htmlFor="jwt">New JWT: </label>
      <input type="text" id="jwt" value={newJWT} onChange={newJWTHandler} />

      <button onClick={() => login({ jwt: newJWT })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('UserVarProvider', () => {
  it('provides the UserState context via a Hook', async () => {
    let userState

    function Foo() {
      userState = useUserVar()
      return <p>asdf</p>
    }

    render(
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <Foo />
        </UserVarProvider>
      </MockedProvider>,
    )
    await waitFor(() =>
      expect(userState).toMatchObject({
        currentUser: { jwt: null, tfaSendMethod: null, userName: null },
        isLoggedIn: expect.any(Function),
        login: expect.any(Function),
        logout: expect.any(Function),
      }),
    )
  })
})

describe('<UserVarProvider/>', () => {
  it('is logged out - can login', () => {
    const { getByText, getByRole } = render(
      // MockedProvider is required as userState is capable of clearing apollo cache
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({ jwt: null, tfaSendMethod: null, userName: null })}
        >
          <UserStateExample />
        </UserVarProvider>
      </MockedProvider>,
    )

    const currentJWTParagraph = getByText(/Current JWT:/)
    const isLoggedInParagraph = getByText(/Is logged in/)
    const newJWTInput = getByRole('textbox', { name: /New JWT:/ })
    const loginButton = getByRole('button', { name: /Login/ })

    const newJWTValue = 'some-new-JWT'

    // Expect logged out
    expect(currentJWTParagraph).toHaveTextContent(/^Current JWT:\s*$/)
    expect(isLoggedInParagraph).toHaveTextContent(/false/)

    // Log in
    userEvent.type(newJWTInput, newJWTValue)
    userEvent.click(loginButton)

    // Expect logged in
    expect(currentJWTParagraph).toHaveTextContent(
      new RegExp(`Current JWT: ${newJWTValue}`),
    )
    expect(isLoggedInParagraph).toHaveTextContent(/true/)
  })

  it('is logged in - can logout', () => {
    const defaultJWT = 'defaultJWT'
    const { getByText, getByRole } = render(
      // MockedProvider is required as userState is capable of clearing apollo cache
      <MockedProvider>
        <UserVarProvider
          userVar={makeVar({
            jwt: defaultJWT,
            tfaSendMethod: null,
            userName: null,
          })}
        >
          <UserStateExample />
        </UserVarProvider>
      </MockedProvider>,
    )

    const currentJWTParagraph = getByText(/Current JWT:/)
    const isLoggedInParagraph = getByText(/Is logged in/)
    const logoutButton = getByRole('button', { name: /Logout/ })

    // Expect logged in
    expect(currentJWTParagraph).toHaveTextContent(
      new RegExp(`Current JWT: ${defaultJWT}`),
    )
    expect(isLoggedInParagraph).toHaveTextContent(/true/)

    // Log out
    userEvent.click(logoutButton)

    // Expect logged out
    expect(currentJWTParagraph).toHaveTextContent(/^Current JWT:\s*$/)
    expect(isLoggedInParagraph).toHaveTextContent(/false/)
  })
})
