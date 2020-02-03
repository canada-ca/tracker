import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, cleanup } from '@testing-library/react'
import { App } from '../App'

describe('<App/>', () => {
  afterEach(cleanup)

  describe('routes', () => {
    describe('/', () => {
      it('renders the main page', () => {
        const { getByRole } = render(
          <MemoryRouter initialEntries={['/']} initialIndex={1}>
            <App />
          </MemoryRouter>,
        )
        expect(getByRole('heading')).toHaveTextContent(/track web/i)
      })
    })
  })
})
