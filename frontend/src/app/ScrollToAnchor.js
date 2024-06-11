import { useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'

function isInteractiveElement(element) {
  const formTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
  const linkTags = ['A', 'AREA']
  return (
    (formTags.includes(element.tagName) && !element.hasAttribute('disabled')) ||
    (linkTags.includes(element.tagName) && element.hasAttribute('href'))
  )
}

function scrollToElement(element) {
  // update focus to where the page is scrolled to
  // unfortunately this doesn't work in safari (desktop and iOS) when blur() is called
  const originalTabIndex = element.getAttribute('tabindex')
  if ([null, 'none'].includes(originalTabIndex) && !isInteractiveElement(element)) {
    element.setAttribute('tabindex', -1)
  }

  const originalOutline = getComputedStyle(element).outline
  const originalBoxShadow = getComputedStyle(element).boxShadow
  if (!isInteractiveElement(element)) {
    element.style.boxShadow = 'var(--chakra-shadows-outline)'
    // set focus outline to none if the element is not interactive to
    // disable the default focus outline (which only appears on some events)
    element.style.outline = 'none'
  }

  element.addEventListener('blur', () => {
    if (!isInteractiveElement(element)) {
      if (originalTabIndex === null) element.removeAttribute('tabindex')
      element.style.boxShadow = originalBoxShadow
      element.style.outline = originalOutline
    }
  })
  element.focus({ preventScroll: true })

  // scroll inside setTimeout to prevent scrollIntoView from being ignored
  // observed in Brave browser where focus's preventScroll prevents scrollIntoView
  setTimeout(() => {
    const preferReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ behavior: preferReducedMotion ? 'auto' : 'smooth', block: 'start' })
  }, 1)

  return true
}

export function ScrollToAnchor() {
  const location = useLocation()
  const lastHash = useRef('')
  const [observer, setObserver] = useState(null)
  const timer = useRef(null)

  // listen to location change using useEffect with location as dependency
  // https://jasonwatmore.com/react-router-v6-listen-to-location-route-change-without-history-listen
  useEffect(() => {
    if (observer !== null) {
      observer.disconnect()
      setObserver(null)
    }

    if (location.hash) {
      lastHash.current = location.hash.slice(1) // safe hash for further use after navigation
    } else {
      lastHash.current = ''
    }

    if (lastHash.current) {
      const el = document.getElementById(lastHash.current)

      if (el) {
        scrollToElement(el)
      } else {
        const observer = new MutationObserver((_mutationsList, observer) => {
          const el = document.getElementById(lastHash.current)
          if (el) {
            clearTimeout(timer.current)
            timer.current = null
            observer.disconnect()
            setObserver(null)
            scrollToElement(el)
          }
        })

        setObserver(observer)
        observer.observe(document, {
          attributes: true,
          childList: true,
          subtree: true,
        })

        timer.current = setTimeout(() => {
          if (observer !== null) {
            observer.disconnect()
            setObserver(null)
          }
        }, 5000)
      }
    }

    return () => {
      if (observer !== null) {
        observer.disconnect()
        setObserver(null)
      }
    }
  }, [location])

  return null
}
