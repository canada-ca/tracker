import { useEffect } from 'react'
import { useLingui } from '@lingui/react/macro'

export const useDocumentTitle = (title, setTitle = true) => {
  const { t } = useLingui()
  useEffect(() => {
    if (setTitle) document.title = t`${title} - Tracker` || 'Tracker'
  })
}
