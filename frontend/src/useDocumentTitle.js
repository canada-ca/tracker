import { useEffect } from 'react'
import { t } from '@lingui/macro'

export const useDocumentTitle = (title, setTitle = true) => {
  useEffect(() => {
    if (setTitle) document.title = t`${title} - Tracker` || 'Tracker'
  })
}
