import React from 'react'
import { waitFor, render } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'
import { ListOf } from '../ListOf'

describe('<ListOf />', () => {
  describe('when passed a null value', () => {
    it('wraps the return value of the ifEmpty prop in a List', async () => {
      const { getByText } = render(
        <ThemeProvider theme={theme}>
          <ListOf elements={null} ifEmpty={() => <em>nothing</em>}>
            {() => <p>something</p>}
          </ListOf>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(getByText('nothing')).toBeInTheDocument()
      })
    })
  })
  describe('with an empty array', () => {
    it('wraps the return value of the ifEmpty prop in a List', async () => {
      const { getByText } = render(
        <ThemeProvider theme={theme}>
          <ListOf elements={[]} ifEmpty={() => <em>nothing</em>}>
            {() => <p>something</p>}
          </ListOf>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(getByText('nothing')).toBeInTheDocument()
      })
    })
  })

  describe('with an array of objects', () => {
    it('calls the child function once for each object', async () => {
      const mock = jest.fn()
      render(
        <ThemeProvider theme={theme}>
          <ListOf
            elements={[{ foo: 'foo' }, { bar: 'bar' }]}
            ifEmpty={() => <em>nothing</em>}
          >
            {mock}
          </ListOf>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(mock).toHaveBeenCalledTimes(2)
      })
    })

    it('passes the current element and the index as arguments', async () => {
      const mock = jest.fn()
      render(
        <ThemeProvider theme={theme}>
          <ListOf
            elements={[{ foo: 'foo' }, { bar: 'bar' }]}
            ifEmpty={() => <em>nothing</em>}
          >
            {mock}
          </ListOf>
        </ThemeProvider>,
      )

      await waitFor(() => {
        expect(mock.mock.calls).toEqual([
          [{ foo: 'foo' }, 0],
          [{ bar: 'bar' }, 1],
        ])
      })
    })
  })
})
