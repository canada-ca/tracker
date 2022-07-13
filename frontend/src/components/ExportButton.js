import React from 'react'
import { Button } from '@chakra-ui/react'
import { arrayOf, object, string, func } from 'prop-types'
import { json2csvAsync } from 'json-2-csv'
import { Trans } from '@lingui/macro'

export function ExportButton({ jsonData, fileName, dataFunction, ...props }) {
  const download = async () => {
    try {
      let data
      if (jsonData) {
        data = await json2csvAsync(jsonData)
      }
      else if (dataFunction) {
        data = await dataFunction()
      }

      const a = document.createElement('a')
      a.href = 'data:text/csv;charset=utf-8,' + encodeURI(data)
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
  dataFunction: func,
}
