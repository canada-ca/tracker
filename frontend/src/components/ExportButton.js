import React from 'react'
import { Button } from '@chakra-ui/react'
import { arrayOf, object, string, func } from 'prop-types'
import { json2csvAsync } from 'json-2-csv'
import { t } from '@lingui/macro'
import { any } from 'prop-types'

export function ExportButton({ jsonData, fileName, dataFunction, children = t`Export to CSV`, ...props }) {
  const download = async () => {
    try {
      let data
      if (jsonData) {
        data = await json2csvAsync(jsonData)
      } else if (dataFunction) {
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
      {children}
    </Button>
  )
}

ExportButton.propTypes = {
  jsonData: arrayOf(object),
  fileName: string,
  dataFunction: func,
  children: any,
}
