import React from 'react'
import { Route } from 'react-router-dom'
import { string } from 'prop-types'
import { t } from '@lingui/macro'
import { useDocumentTitle } from './useDocumentTitle'

export const Page = ({ title, ...props }) => {
  useDocumentTitle(`${title} - ${t`Tracker`}`)

  return <Route {...props} />
}

Page.propTypes = {
  title: string,
}
