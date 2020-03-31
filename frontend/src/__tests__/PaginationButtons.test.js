import React from 'react'
import { PaginationButtons } from '../PaginationButtons'
import { render, cleanup } from '@testing-library/react'
import { ThemeProvider, theme } from '@chakra-ui/core'

describe('<PaginationButtons />', () => {
  afterEach(cleanup)

  it('the component renders', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <PaginationButtons next={true} previous={true} />
      </ThemeProvider>,
    )
    expect(container).toBeDefined()
  })

  it('buttons are disabled when props are set to false', async () => {
    const { container, getByLabelText } = render(
      <ThemeProvider>
        <PaginationButtons next={false} previous={false} />
      </ThemeProvider>,
    )
    expect(container).toBeTruthy()

    const nextButton = getByLabelText('Next page')
    expect(nextButton).toHaveAttribute('aria-disabled')
    expect(nextButton).toHaveAttribute('disabled')

    const previousButton = getByLabelText('Previous page')
    expect(previousButton).toHaveAttribute('aria-disabled')
    expect(previousButton).toHaveAttribute('disabled')
  })

  it('buttons are not disabled when props are set to true', async () => {
    const { container, getByLabelText } = render(
      <ThemeProvider>
        <PaginationButtons next={true} previous={true} />
      </ThemeProvider>,
    )
    expect(container).toBeTruthy()

    const nextButton = getByLabelText('Next page')
    expect(nextButton).not.toHaveAttribute('aria-disabled')
    expect(nextButton).not.toHaveAttribute('disabled')

    const previousButton = getByLabelText('Previous page')
    expect(previousButton).not.toHaveAttribute('aria-disabled')
    expect(previousButton).not.toHaveAttribute('disabled')
  })
})
