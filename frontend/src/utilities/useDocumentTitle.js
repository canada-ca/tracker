import { useEffect } from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'

export const useDocumentTitle = (title, setTitle = true) => {
  const { i18n } = useLingui()
  useEffect(() => {
    if (setTitle) document.title = i18n._(t`${title} - Tracker`) || 'Tracker'
  })
}
