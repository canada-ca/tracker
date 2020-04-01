import React from 'react'
import { render } from '@testing-library/react'
import { Layout } from '../Layout'

describe('<Layout />', () => {
  beforeEach(() => (global.scrollTo = jest.fn()))

  it('renders', () => {
    render(<Layout />)
  })

  it('renders children correctly', () => {
    const { getAllByText } = render(
      <Layout>
        <div>foo</div>
      </Layout>,
    )

    const test = getAllByText(/foo/)
    expect(test).toHaveLength(1)
  })
})
