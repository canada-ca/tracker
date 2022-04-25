import React from 'react'
import { Button } from '@chakra-ui/react'
import { arrayOf, object, string } from 'prop-types'
import { json2csvAsync } from 'json-2-csv'
import { Trans } from '@lingui/macro'

export function ExportButton({ jsonData, fileName, ...props }) {
  const download = async () => {
    try {
      const csv = await json2csvAsync(jsonData)
      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv)
      a.download = `${fileName}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <Button {...props} variant="primary" onClick={download}>
      <Trans>Export to CSV</Trans>
    </Button>
  )
}

ExportButton.propTypes = {
  jsonData: arrayOf(object),
  fileName: string,
}
