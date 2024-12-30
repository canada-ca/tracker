import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { FilterList } from '../FilterList'

describe('FilterList', () => {
  const setFiltersMock = jest.fn()
  const filters = ['filter1', 'filter2']

  const resetToFirstPage = jest.fn()

  beforeEach(() => {
    setFiltersMock.mockClear()
    resetToFirstPage.mockClear()
  })

  it('renders without crashing', () => {
    const { container } = render(
      <FilterList filters={filters} setFilters={setFiltersMock} resetToFirstPage={resetToFirstPage} />,
    )
    expect(container).toBeInTheDocument()
  })

  it('displays the correct number of filters', () => {
    const { getAllByRole } = render(
      <FilterList filters={filters} setFilters={setFiltersMock} resetToFirstPage={resetToFirstPage} />,
    )
    const filterTags = getAllByRole('button')
    expect(filterTags.length).toBe(filters.length)
  })

  it('calls setFilters when a filter is removed', () => {
    const { getAllByRole } = render(
      <FilterList filters={filters} setFilters={setFiltersMock} resetToFirstPage={resetToFirstPage} />,
    )
    const closeButton = getAllByRole('button')[0]
    fireEvent.click(closeButton)
    expect(setFiltersMock).toHaveBeenCalled()
  })

  it('calls resetToFirstPage when a filter is removed', () => {
    const { getAllByRole } = render(
      <FilterList filters={filters} setFilters={setFiltersMock} resetToFirstPage={resetToFirstPage} />,
    )
    const closeButton = getAllByRole('button')[0]
    fireEvent.click(closeButton)
    expect(resetToFirstPage).toHaveBeenCalled()
  })
})
