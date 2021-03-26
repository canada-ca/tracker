import React from 'react'
import { Route } from 'react-router-dom'
import { string } from 'prop-types'
import { useDocumentTitle } from './useDocumentTitle'

export const Page = ({ title, ...props }) => {
  useDocumentTitle(title)

  return <Route {...props} />
}

Page.propTypes = {
  title: string,
}
