/** @jsx jsx */
import { jsx, css } from '@emotion/core'
import { useLingui } from '@lingui/react'
import { LocaleSwitcher } from './LocaleSwitcher'
import gocSignatureBlockEn from './images/goc-signature-block-en.svg'
import gocSignatureBlockFr from './images/goc-signature-block-fr.svg'

export const Header = () => {
  const { i18n } = useLingui()
  return (
    <header
      css={css`
        @media screen and (min-width: 35.5em) & {
          padding-bottom: 30px;
          text-align: right;
        }
        padding: 2rem 0;
      `}
    >
      <div>
        <div
          css={css`
            justify-content: space-between;
            flex-direction: row;
            display: flex;
            align-items: stretch;
          `}
        >
          <div
            css={css`
              @media screen and (min-width: 35.5em) & {
                width: 360px;
                margin-bottom: 0px;
              }
              width: 272px;
              margin-bottom: 15px;
            `}
          >
            {i18n.locale === 'fr' && (
              <img
                css={css`
                  width: 272px;
                  margin-bottom: 15px;
                `}
                src={gocSignatureBlockFr}
                alt="Government of Canada"
              />
            )}
            {i18n.locale === 'en' && (
              <img
                css={css`
                  width: 272px;
                  margin-bottom: 15px;
                `}
                src={gocSignatureBlockEn}
                alt="Government of Canada"
              />
            )}
          </div>
          <div
            css={css`
              display: flex;
              align-elements: flex-end;
              text-align: right;
            `}
          >
            <LocaleSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
