import React from 'react'
import { createMemoryHistory } from 'history'
import { waitFor, render } from '@testing-library/react'
import { RouteIf } from '../RouteIf'
import { MemoryRouter, Router, Switch } from 'react-router-dom'

describe('<RouteIf/>', () => {
  describe('when props.condition is truthy', () => {
    it(`renders it's children`, async () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={['/protected']}>
          <Switch>
            <RouteIf
              condition={true}
              consequent="/protected"
              alternate="/somewhere-else"
            >
              <p>protected</p>
            </RouteIf>
          </Switch>
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(getByText('protected')).toBeInTheDocument()
      })
    })

    it('sets the url to consequent path', async () => {
      // create a history object so we can inspect it afterwards for the side effects of components operations
      const history = createMemoryHistory({
        initialEntries: ['/protected'],
        initialIndex: 0,
      })

      // render our component passing in our history obj.
      render(
        <Router history={history}>
          <Switch>
            <RouteIf
              condition={true}
              consequent="/protected"
              alternate="/somewhere-else"
            >
              <p>protected</p>
            </RouteIf>
          </Switch>
        </Router>,
      )

      await waitFor(() => {
        // Has the history obj been effected the way we think?
        expect(history.location.pathname).toEqual('/protected')
      })
    })
  })
  describe('when props.condition is falsey', () => {
    it('redirects to the alternate path', async () => {
      const history = createMemoryHistory({
        initialEntries: ['/protected'],
        initialIndex: 0,
      })

      render(
        <Router history={history}>
          <Switch>
            <RouteIf
              condition={false}
              consequent="/protected"
              alternate="/somewhere-else"
            >
              <p>protected</p>
            </RouteIf>
          </Switch>
        </Router>,
      )

      await waitFor(() => {
        expect(history.location.pathname).toEqual('/somewhere-else')
      })
    })
  })
})
