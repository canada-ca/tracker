import React from 'react'
import { PaginationButtons } from '../PaginationButtons'
import { cleanup, render } from '@testing-library/react'
import { theme, ChakraProvider } from '@chakra-ui/react'

describe('<PaginationButtons />', () => {
  afterEach(cleanup)

  it('the component renders', async () => {
    const { container } = render(
      <ChakraProvider theme={theme}>
        <PaginationButtons
          perPage={2}
          total={8}
          paginate={() => {}}
          currentPage={1}
        />
      </ChakraProvider>,
    )
    expect(container).toBeDefined()
  })

  it('left arrow buttons are disabled when on first page', async () => {
    const { container, getByLabelText } = render(
      <ChakraProvider>
        <PaginationButtons
          perPage={2}
          total={8}
          paginate={() => {}}
          currentPage={1}
        />
      </ChakraProvider>,
    )
    expect(container).toBeTruthy()

    const previousButton = getByLabelText('Previous page')
    expect(previousButton).toHaveAttribute('disabled')

    const skipToFirstButton = getByLabelText('Skip to first page')
    expect(skipToFirstButton).toHaveAttribute('disabled')

    const nextButton = getByLabelText('Next page')
    expect(nextButton).not.toHaveAttribute('disabled')

    const skipToLastButton = getByLabelText('Skip to last page')
    expect(skipToLastButton).not.toHaveAttribute('disabled')
  })

  it('right arrow buttons are disabled when on last page', async () => {
    const { container, getByLabelText } = render(
      <ChakraProvider>
        <PaginationButtons
          perPage={2}
          total={8}
          paginate={() => {}}
          currentPage={4}
        />
      </ChakraProvider>,
    )
    expect(container).toBeTruthy()

    const previousButton = getByLabelText('Previous page')
    expect(previousButton).not.toHaveAttribute('disabled')

    const skipToFirstButton = getByLabelText('Skip to first page')
    expect(skipToFirstButton).not.toHaveAttribute('disabled')

    const nextButton = getByLabelText('Next page')
    expect(nextButton).toHaveAttribute('disabled')

    const skipToLastButton = getByLabelText('Skip to last page')
    expect(skipToLastButton).toHaveAttribute('disabled')
  })
})
