import { ApolloLink } from '@apollo/client'
import { MockLink } from '@apollo/client/testing'

const errorLink = new ApolloLink((operation, forward) => {
  console.log(`starting request for ${operation.operationName}`)
  const observer = forward(operation)
  // errors will be sent to the errorCallback
  observer.subscribe({
    error: (e) => console.log('caught error with errorLink:', e),
  })
  return observer.map((data) => {
    console.log(`ending request for ${operation.operationName}`)
    return data
  })
})

export function mockLink(mocks, addTypename = false) {
  const mockLink = new MockLink(mocks, addTypename)
  mockLink.setOnError(error => {
    if (error.message.match(/No more mocked responses for the query/)) {
      // Do nothing
      return
    }
    throw error
  })
  return ApolloLink.from([errorLink, mockLink])
}
