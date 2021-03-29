import React from 'react'
import { Route } from 'react-router-dom'
import { bool, string } from 'prop-types'
import { useDocumentTitle } from './useDocumentTitle'

export const Page = ({ title, setTitle, ...props }) => {
  useDocumentTitle(title, setTitle)

  return <Route {...props} />
}

Page.propTypes = {
  title: string,
  setTitle: bool,
}
