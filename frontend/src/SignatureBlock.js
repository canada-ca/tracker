import React from 'react'
import { useLingui } from '@lingui/react'
import gocSignatureBlockEn from './images/goc-signature-block-en.svg'
import gocSignatureBlockFr from './images/goc-signature-block-fr.svg'

export const SignatureBlock = () => {
  const { i18n } = useLingui()
  return (
    <>
      {i18n.locale === 'fr' && (
        <img
          width="272px"
          height="25.219px"
          src={gocSignatureBlockFr}
          alt="Government of Canada"
        />
      )}
      {i18n.locale === 'en' && (
        <img
          width="272px"
          height="25.219px"
          src={gocSignatureBlockEn}
          alt="Government of Canada"
        />
      )}
    </>
  )
}
