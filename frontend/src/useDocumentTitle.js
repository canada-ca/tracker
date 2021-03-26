import { useEffect } from 'react'

export const useDocumentTitle = (title, setTitle = true) => {
  useEffect(() => {
    if (setTitle) document.title = title || 'Tracker'
  })
}
