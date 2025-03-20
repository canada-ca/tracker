import React from 'react'
import { any, bool, string } from 'prop-types'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

export const Page = ({ title, setTitle, children }) => {
  useDocumentTitle(title, setTitle)
  return <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>{children}</ErrorBoundary>
}

Page.propTypes = {
  title: string,
  setTitle: bool,
  children: any,
}
