import React, { useContext, useReducer } from 'react'
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

  const userState = {
    currentUser: state,
    isLoggedIn: () => !equal(state, initialState),
    login: (user) => dispatch({ type: 'LOGIN', user }),
    logout: () => dispatch({ type: 'LOGOUT', user: initialState }),
  }

  return <Provider value={userState}>{children}</Provider>
}

export const UserState = Consumer

export const useUserState = () => useContext(UserStateContext)
