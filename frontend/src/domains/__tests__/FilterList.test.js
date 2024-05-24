import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { FilterList } from '../FilterList'

describe('FilterList', () => {
  const setFiltersMock = jest.fn()
  const filters = ['filter1', 'filter2']

  beforeEach(() => {
    setFiltersMock.mockClear()
  })

  it('renders without crashing', () => {
    const { container } = render(<FilterList filters={filters} setFilters={setFiltersMock} />)
    expect(container).toBeInTheDocument()
  })

  it('displays the correct number of filters', () => {
    const { getAllByRole } = render(<FilterList filters={filters} setFilters={setFiltersMock} />)
    const filterTags = getAllByRole('button')
    expect(filterTags.length).toBe(filters.length)
  })

  it('calls setFilters when a filter is removed', () => {
    const { getAllByRole } = render(<FilterList filters={filters} setFilters={setFiltersMock} />)
    const closeButton = getAllByRole('button')[0]
    fireEvent.click(closeButton)
    expect(setFiltersMock).toHaveBeenCalled()
  })
})
