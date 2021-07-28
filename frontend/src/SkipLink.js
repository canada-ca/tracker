/** @jsx jsx */
import PropTypes from 'prop-types'
import { css, jsx } from '@emotion/react'
import { Link } from '@chakra-ui/react'

const makeInvisible = css`
  left: -999px;
  position: absolute;
  top: auto;
  overflow: hidden;
  z-index: -999;
  :focus,
  :active {
    background-color: white;
    left: auto;
    top: auto;
    height: auto;
    overflow: auto;
    z-index: 999;
  }
`
export const SkipLink = ({ invisible, ...rest }) => (
  <Link
    backgroundColor="white"
    css={invisible ? makeInvisible : null}
    aria-label="Skip to main Content"
    {...rest}
  />
)

SkipLink.defaultProps = {
  invisible: false,
}
SkipLink.propTypes = {
  invisible: PropTypes.bool,
}
