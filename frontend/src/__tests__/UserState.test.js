// import React from 'react'
// import { fireEvent, render, waitFor } from '@testing-library/react'
//
// import { UserState, UserStateProvider, useUserVar } from '../useUserVar'
// import { MockedProvider } from '@apollo/client/testing'
//
// describe('useUserState()', () => {
//   it('provides the UserState context via a Hook', async () => {
//     let userState
//
//     function Foo() {
//       const state = useUserVar()
//       userState = state
//       return <p>asdf</p>
//     }
//
//     render(
//       <MockedProvider>
//
//           <Foo />
//
//       </MockedProvider>,
//     )
//     await waitFor(() =>
//       expect(userState).toMatchObject({
//         currentUser: { jwt: null, tfaSendMethod: null, userName: null },
//         isLoggedIn: expect.any(Function),
//         login: expect.any(Function),
//         logout: expect.any(Function),
//       }),
//     )
//   })
// })
//
// describe('', () => {
//   describe('given an initial state', () => {
//     let initialState
//     beforeEach(() => {
//       initialState = {
//         userName: null,
//         jwt: null,
//         tfaSendMethod: null,
//       }
//     })
//
//     it('sets the currentUser and supplies functions to change user state', () => {
//       let providedState
//
//       render(
//         <MockedProvider>
//           <UserStateProvider initialState={initialState}>
//             <UserState>
//               {(value) => {
//                 providedState = value
//                 return <p>{value.currentUser.userName}</p>
//               }}
//             </UserState>
//
//         </MockedProvider>,
//       )
//       expect(providedState).toMatchObject({
//         { null, tfaSendMethod: null, userName: null },
//         expect.any(Function),
//         login: expect.any(Function),
//         logout: expect.any(Function),
//       })
//     })
//
//     describe('state altering functions', () => {
//       describe('login()', () => {
//         it('sets the currentUser to the values provided', async () => {
//           const testUser = {
//             jwt: 'string',
//             tfaSendMethod: true,
//             userName: 'foo@example.com',
//           }
//
//           const { getByTestId } = render(
//             <MockedProvider>
//
//                 <UserState>
//                   {({ currentUser, login }) => {
//                     return (
//                       <div>
//                         <p data-testid="username">{currentUser.userName}</p>
//                         <button
//                           data-testid="loginbutton"
//                           onClick={() => login(testUser)}
//                         />
//                       </div>
//                     )
//                   }}
//                 </UserState>
//
//             </MockedProvider>,
//           )
//
//           fireEvent.click(getByTestId('loginbutton'))
//
//           await waitFor(() => {
//             expect(getByTestId('username').innerHTML).toEqual('foo@example.com')
//           })
//         })
//       })
//       describe('logout()', () => {
//         it('sets the currentUser to initialState', async () => {
//           let currentUser, login, logout
//
//           const testUser = {
//             jwt: 'string',
//             tfaSendMethod: true,
//             userName: 'foo@example.com',
//           }
//
//           render(
//             <MockedProvider>
//
//                 <UserState>
//                   {(state) => {
//                     const { currentUser: cu, login: li, logout: lo } = state
//                     currentUser = cu
//                     login = li
//                     logout = lo
//                     return <p data-testid="username">{cu.userName}</p>
//                   }}
//                 </UserState>
//
//             </MockedProvider>,
//           )
//
//           await waitFor(() => login(testUser))
//
//           await waitFor(() => {
//             expect(currentUser).toMatchObject(testUser)
//           })
//
//           await waitFor(() => logout())
//
//           await waitFor(() => {
//             expect(currentUser).toMatchObject(initialState)
//           })
//         })
//       })
//       describe('isLoggedIn()', () => {
//         it('returns true if currentUser object values differ from initialState', async () => {
//           const testUser = {
//             jwt: 'string',
//             tfaSendMethod: true,
//             userName: 'foo@example.com',
//           }
//
//           let isLoggedIn, login
//
//           render(
//             <MockedProvider>
//
//                 <UserState>
//                   {(state) => {
//                     const { isLoggedIn: ili, login: li } = state
//                     isLoggedIn = ili
//                     login = li
//                     return (
//                       <p data-testid="username">{state.currentUser.userName}</p>
//                     )
//                   }}
//                 </UserState>
//
//             </MockedProvider>,
//           )
//
//           await waitFor(() => login(testUser))
//
//           await waitFor(() => {
//             expect(isLoggedIn()).toEqual(true)
//           })
//         })
//
//         it('returns false if currentUser object values match initialState', async () => {
//           const testUser = {
//             jwt: 'string',
//             tfaSendMethod: true,
//             userName: 'foo@example.com',
//           }
//
//           let isLoggedIn, logout, login
//
//           render(
//             <MockedProvider>
//
//                 <UserState>
//                   {(state) => {
//                     const { isLoggedIn: ili, login: li, logout: lo } = state
//                     isLoggedIn = ili
//                     login = li
//                     logout = lo
//                     return (
//                       <p data-testid="username">{state.currentUser.userName}</p>
//                     )
//                   }}
//                 </UserState>
//
//             </MockedProvider>,
//           )
//
//           await waitFor(() => login(testUser))
//           await waitFor(() => logout())
//
//           await waitFor(() => {
//             expect(isLoggedIn()).toEqual(false)
//           })
//         })
//       })
//     })
//   })
// })
