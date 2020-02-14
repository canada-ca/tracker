import React from 'react'
import { cleanProps, styledSystemProps } from '../cleanProps'
import styled from '@emotion/styled'
import { render, cleanup } from '@testing-library/react'

describe('cleanProps() utility', () => {
  afterEach(cleanup)

  var props = {}
  styledSystemProps.forEach(function(e) {
    props[e] = 'foo'
  })

  const ExampleComponent = styled('p', {
    shouldForwardProp: prop => cleanProps(prop),
  })`
    font-family: mono;
  `

  it('Stops styled system props from being forwarded to the html', () => {
    const { getByText } = render(
      <ExampleComponent {...props}>test</ExampleComponent>,
    )

    const test = getByText(/test/)

    expect(test.attributes.length).toBe(1)
    expect(test).toHaveAttribute('class')
  })

  it('Allows non styled system props to be forwarded to the html', () => {
    const { getByText } = render(
      <ExampleComponent foo="bar" {...props}>
        test
      </ExampleComponent>,
    )

    const test = getByText(/test/)

    expect(test).toHaveAttribute('foo')
  })
})
