import React from 'react'
import { render } from '@testing-library/react'
import { renderToString } from 'react-dom/server'

import { CrossHatch, Dots, Stripes, ZigZag } from '../summaries/patterns'

describe('SVG patterns', () => {
  describe('<Stripes/>', () => {
    it('renders an SVG pattern element', () => {
      const { getByTestId } = render(
        <svg>
          <defs>
            <Stripes data-testid="pattern" />
          </defs>
        </svg>,
      )

      const pattern = getByTestId('pattern')

      expect(pattern.nodeName).toEqual('pattern')
    })

    describe('without props', () => {
      it('has an id of "stripes"', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Stripes data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('stripes')
      })

      it('renders a path and rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Stripes data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(
          /<path d="M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9" stroke="#000" stroke-width="2">/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="#fff">/,
        )
      })
    })

    describe('with id="foo"', () => {
      it('sets the id to foo', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Stripes id="foo" data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('foo')
      })
    })

    describe('passing an angle', () => {
      it('sets a rotate transform on the pattern element', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Stripes data-testid="pattern" angle={45} />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern).toHaveAttribute('patternTransform', 'rotate(45)')
      })
    })

    describe('when passing background and color', () => {
      it('sets the stroke of the path and fill for the rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Stripes
                data-testid="pattern"
                background="background"
                color="somecolor"
              />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(
          /<path d="M 0 10 L 10 0 M -1 1 L 1 -1 M 9 11 L 11 9" stroke="somecolor"/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="background">/,
        )
      })
    })
  })

  describe('<ZigZag/>', () => {
    it('renders an SVG pattern element', () => {
      const { getByTestId } = render(
        <svg>
          <defs>
            <ZigZag data-testid="pattern" />
          </defs>
        </svg>,
      )

      const pattern = getByTestId('pattern')

      expect(pattern.nodeName).toEqual('pattern')
    })

    describe('without props', () => {
      it('has an id of "crosshatch"', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <ZigZag data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('zigzag')
      })

      it('renders a path and rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <ZigZag data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(
          /<path d="M 0 0 L 5 10 L 10 0" stroke="#fff" fill="none" stroke-width="0.5">/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="#000">/,
        )
      })
    })

    describe('with id="foo"', () => {
      it('sets the id to foo', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <ZigZag id="foo" data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('foo')
      })
    })

    describe('passing an angle', () => {
      it('sets a rotate transform on the pattern element', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <ZigZag data-testid="pattern" angle={45} />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern).toHaveAttribute('patternTransform', 'rotate(45)')
      })
    })

    describe('when passing background and color', () => {
      it('sets the stroke of the path and fill for the rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <ZigZag
                data-testid="pattern"
                background="background"
                color="somecolor"
              />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(
          /<path d="M 0 0 L 5 10 L 10 0" stroke="somecolor"/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="background">/,
        )
      })
    })
  })

  describe('<CrossHatch/>', () => {
    it('renders an SVG pattern element', () => {
      const { getByTestId } = render(
        <svg>
          <defs>
            <CrossHatch data-testid="pattern" />
          </defs>
        </svg>,
      )

      const pattern = getByTestId('pattern')

      expect(pattern.nodeName).toEqual('pattern')
    })

    describe('without props', () => {
      it('has an id of "crosshatch"', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <CrossHatch data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('crosshatch')
      })

      it('renders a path and rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <CrossHatch data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(/<path fill="none" d="M0 0h10v10h-10z"/)
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="#000">/,
        )
      })
    })

    describe('with id="foo"', () => {
      it('sets the id to foo', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <CrossHatch id="foo" data-testid="pattern" />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern.id).toEqual('foo')
      })
    })

    describe('passing an angle', () => {
      it('sets a rotate transform on the pattern element', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <CrossHatch data-testid="pattern" angle={45} />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')

        expect(pattern).toHaveAttribute('patternTransform', 'rotate(45)')
      })
    })

    describe('when passing background and color', () => {
      it('sets the stroke of the path and fill for the rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <CrossHatch
                data-testid="pattern"
                background="background"
                color="somecolor"
              />
            </defs>
          </svg>,
        )

        const pattern = getByTestId('pattern')
        const path = pattern.querySelector('path')
        const rect = pattern.querySelector('rect')

        expect(path.outerHTML).toMatch(
          /<path fill="none" d="M0 0h10v10h-10z" stroke-width="0.5" stroke="somecolor">/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="background">/,
        )
      })
    })
  })

  describe('<Dots/>', () => {
    it('renders an SVG pattern element', () => {
      const { getByTestId } = render(
        <svg>
          <defs>
            <Dots data-testid="dots" />
          </defs>
        </svg>,
      )

      const dots = getByTestId('dots')

      expect(dots.nodeName).toEqual('pattern')
    })

    describe('without props', () => {
      it('has an id of "dots"', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Dots data-testid="dots" />
            </defs>
          </svg>,
        )

        const dots = getByTestId('dots')

        expect(dots.id).toEqual('dots')
      })

      it('renders a circle and rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Dots data-testid="dots" />
            </defs>
          </svg>,
        )

        const dots = getByTestId('dots')
        const circle = dots.querySelector('circle')
        const rect = dots.querySelector('rect')

        expect(circle.outerHTML).toMatch(
          /<circle cx="1" cy="1" r="1" fill="#fff">/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="#000">/,
        )
      })
    })

    describe('with id="foo"', () => {
      it('sets the id to foo', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Dots id="foo" data-testid="dots" />
            </defs>
          </svg>,
        )

        const dots = getByTestId('dots')

        expect(dots.id).toEqual('foo')
      })
    })

    describe('passing a size', () => {
      it('sets the radius of the circle', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Dots data-testid="dots" size={9999} />
            </defs>
          </svg>,
        )

        const dots = getByTestId('dots')
        const circle = dots.querySelector('circle')

        expect(circle.outerHTML).toMatch(
          /<circle cx="1" cy="1" r="9999" fill="#fff">/,
        )
      })
    })

    describe('when passing background and color', () => {
      it('sets the fill for the circle and rect', () => {
        const { getByTestId } = render(
          <svg>
            <defs>
              <Dots
                data-testid="dots"
                background="background"
                color="somecolor"
              />
            </defs>
          </svg>,
        )

        const dots = getByTestId('dots')
        const circle = dots.querySelector('circle')
        const rect = dots.querySelector('rect')

        expect(circle.outerHTML).toMatch(
          /<circle cx="1" cy="1" r="1" fill="somecolor">/,
        )
        expect(rect.outerHTML).toMatch(
          /<rect width="10" height="10" fill="background">/,
        )
      })
    })

    it('is referred to by id', () => {
      const svg = renderToString(
        <svg>
          <defs>
            <Dots id="mydots" />
          </defs>
          <rect fill="url(#mydots)" height="10" width="10" />
        </svg>,
      )

      expect(svg).toEqual(
        '<svg data-reactroot=""><defs><pattern id="mydots" patternUnits="userSpaceOnUse" width="10" height="10"><rect width="10" height="10" fill="#000"></rect><circle cx="1" cy="1" r="1" fill="#fff"></circle></pattern></defs><rect fill="url(#mydots)" height="10" width="10"></rect></svg>',
      )
    })
  })
})
