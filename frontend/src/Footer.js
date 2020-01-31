/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import PropTypes from 'prop-types'

export const Footer = ({ children }) => (
  <footer
    css={css`
      padding-top: 20px;
      padding-bottom: 20px;
      border-top: 4px solid #284162;
      height: 80px;
      position: absolute;
      bottom: 0;
      width: 100%;
    `}
  >
    <div
      css={css`
        display: flex;
        max-width: 960px;
        margin: 0 auto;
        padding-left: 20px;
        padding-right: 20px;
        align-items: flex-end;
        flex-direction: row-reverse;
        @media screen and (min-width: 48em) {
          & {
            justify-content: space-between;
            height: 35px;
          }
        }
      `}
    >
      {children}
    </div>
  </footer>
)

Footer.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node),
}
