import React, { useContext, useReducer } from 'react'
import { object, node } from 'prop-types'
import equal from 'fast-deep-equal'

const UserStateContext = React.createContext()
const { Provider, Consumer } = UserStateContext

export function UserStateProvider({ initialState, children }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'LOGIN':
        return Object.assign({}, state, action.user)
      case 'LOGOUT':
        return Object.assign({}, state, action.user)
      default:
        return state
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  console.log('State: ', state)

  const userState = {
    currentUser: state,
    isLoggedIn: () => !equal(state, initialState),
    isAdmin: () => {
      return true
    },
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
