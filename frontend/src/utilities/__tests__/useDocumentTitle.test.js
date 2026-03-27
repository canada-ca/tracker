import React from 'react'
import { render } from '@testing-library/react'
import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { en } from 'make-plural/plurals'
import { useDocumentTitle } from '../useDocumentTitle'

describe('useDocumentTitle', () => {
  describe('when passed a string', () => {
    it('sets the document title', async () => {
      function Foo() {
        useDocumentTitle('foo')
        return <p>foo</p>
      }

      expect(document.title).toEqual('')

      render(
        <I18nProvider i18n={i18n}>
          <Foo />
        </I18nProvider>,
      )
      expect(document.title).toEqual('foo - Tracker')
    })
  })
})
