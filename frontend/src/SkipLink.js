/** @jsx jsx */
import PropTypes from 'prop-types'
import { jsx, css } from '@emotion/core'
import { Link } from '@chakra-ui/core'

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
    {...rest}
  />
)

SkipLink.defaultProps = {
  invisible: false,
}
SkipLink.propTypes = {
  invisible: PropTypes.bool,
}
