/*
  Temporary file to populate the summary table with data
  delete file once table is connected to API
*/

import React from 'react'
import { Icon } from '@chakra-ui/core'

const range = (len) => {
  const arr = []
  for (let i = 0; i < len; i++) {
    arr.push(i)
  }
  return arr
}

const generateWebStatusIcon = () => {
  const randNum = Math.floor(Math.random() * 100 + 1)
  let statusIcon
  if (randNum < 70) {
    statusIcon = <Icon name="check" color="green.300" />
  } else {
    statusIcon = <Icon name="warning" color="red.500" />
  }
  return statusIcon
}

const generateEmailStatusIcon = () => {
  const randNum = Math.floor(Math.random() * 100 + 1)
  let statusIcon
  if (randNum < 33) {
    statusIcon = <Icon name="check" color="green.300" />
  } else if (randNum >= 33 && randNum < 66) {
    statusIcon = <Icon name="warning-2" color="yellow.400" />
  } else {
    statusIcon = <Icon name="warning" color="red.500" />
  }
  return statusIcon
}

const domainNames = [
  'cyber.gc.ca',
  'tbs-sct.gc.ca',
  'canada.ca',
  'cra-arc.gc.ca',
  'pm.gc.ca',
  'cse-cst.gc.ca',
  'forces.gc.ca',
  'faker.gc.ca',
  'rcmp-grc.gc.ca',
]

const newDomain = () => {
  const ind = Math.floor(Math.random() * 9)
  return {
    host_domain: domainNames[ind],
    https_result: generateWebStatusIcon(),
    hsts_result: generateWebStatusIcon(),
    preloaded_result: generateWebStatusIcon(),
    ssl_result: generateWebStatusIcon(),
    protocol_cipher_result: generateWebStatusIcon(),
    cert_use_result: generateWebStatusIcon(),
    dmarc_result: generateEmailStatusIcon(),
    dkim_result: generateEmailStatusIcon(),
    spf_result: generateEmailStatusIcon(),
  }
}

export default function makeSummaryTableData(...lens) {
  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map((d) => {
      return {
        ...newDomain(),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }
  return makeDataLevel()
}
