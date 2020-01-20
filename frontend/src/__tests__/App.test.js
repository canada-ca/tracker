import React from 'react'
import { render, cleanup } from '@testing-library/react'
import ReactDOM from 'react-dom'
import { App } from '../App'

describe('<App/>', () => {
  afterEach(cleanup)
  it('renders without crashing', () => {
    render(<App />)
  })
})
