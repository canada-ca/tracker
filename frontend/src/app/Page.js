import React from 'react'
import { bool, string } from 'prop-types'

import { useDocumentTitle } from '../utilities/useDocumentTitle'

export const Page = ({ title, setTitle, children }) => {
  useDocumentTitle(title, setTitle)

  return children
}

Page.propTypes = {
  title: string,
  setTitle: bool,
}
