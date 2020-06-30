/* eslint-disable react/jsx-key */
/*
  Temporary file to populate the summary table with data
  delete file once table is connected to API
*/

import React from 'react'
import { Icon, Link } from '@chakra-ui/core'
import { Link as RouteLink } from 'react-router-dom'

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

const newDomain = (names) => {
  const ind = Math.floor(Math.random() * 9)
  return {
    host_domain: names[ind],
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

export default function MakeSummaryTableData(...lens) {
  const domainNames = [
    <Link as={RouteLink} to={'organizations/domain/cyber'}>
      cyber.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/tbs'}>
      tbs-sct.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/canada'}>
      canada.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/cra'}>
      cra-arc.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/prime-minister'}>
      pm.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/cse'}>
      cse-cst.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/forces'}>
      forces.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/faker'}>
      faker.gc.ca
    </Link>,
    <Link as={RouteLink} to={'organizations/domain/rcmp'}>
      rcmp-grc.gc.ca
    </Link>,
  ]

  const makeDataLevel = (depth = 0) => {
    const len = lens[depth]
    return range(len).map(() => {
      return {
        ...newDomain(domainNames),
        subRows: lens[depth + 1] ? makeDataLevel(depth + 1) : undefined,
      }
    })
  }
  return makeDataLevel()
}
