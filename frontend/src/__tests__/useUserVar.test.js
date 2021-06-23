import React, { useState } from 'react'
import { render } from '@testing-library/react'
import { makeVar } from '@apollo/client'
import { useUserVar } from '../useUserVar'
import { MockedProvider } from '@apollo/client/testing'
import userEvent from '@testing-library/user-event'

// eslint-disable-next-line react/prop-types
const UseUserStateExample = ({ reactiveVar }) => {
  const { login, logout, currentUser, isLoggedIn } = useUserVar(reactiveVar)
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

describe('useUserVar', () => {
  it('is logged out - can login', () => {
    const testVar = makeVar({})
    const { getByText, getByRole } = render(
      // MockedProvider is required as useUserVar is capable of clearing apollo cache
      <MockedProvider>
        <UseUserStateExample reactiveVar={testVar} />
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
    const defaultJWT = 'default-JWT'
    const testVar = makeVar({ jwt: defaultJWT })

    const { getByText, getByRole } = render(
      // MockedProvider is required as useUserVar is capable of clearing apollo cache
      <MockedProvider>
        <UseUserStateExample reactiveVar={testVar} />
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
