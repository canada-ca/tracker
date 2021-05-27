import React, { useContext, useReducer } from 'react'
import { object, node } from 'prop-types'
import equal from 'fast-deep-equal'
import { useApolloClient } from '@apollo/client'

const UserStateContext = React.createContext()
const { Provider, Consumer } = UserStateContext

export function UserStateProvider({ initialState, children }) {
  const client = useApolloClient()

  const reducer = (state, action) => {
    switch (action.type) {
      case 'LOGIN':
        return Object.assign({}, state, action.user)
      case 'LOGOUT':
        client.resetStore()
        return Object.assign({}, state, action.user)

      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const userState = {
    currentUser: state,
    isLoggedIn: () => !equal(state, initialState),
    login: (user) => dispatch({ type: 'LOGIN', user }),
    logout: () => dispatch({ type: 'LOGOUT', user: initialState }),
  }

  return <Provider value={userState}>{children}</Provider>
}

UserStateProvider.propTypes = {
  initialState: object.isRequired,
  children: node.isRequired,
}

export const UserState = Consumer

export const useUserState = () => useContext(UserStateContext)
