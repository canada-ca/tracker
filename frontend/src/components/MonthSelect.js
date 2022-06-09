import { Select } from '@chakra-ui/react'
import { any, func } from 'prop-types'
import React from 'react'
import { t } from '@lingui/macro'

export function MonthSelect({ selectedValue, handleChange, ...props }) {
  const currentDate = new Date()
  const months = [
    {
      value: 'January',
      text: t`January`,
    },
    {
      value: 'February',
      text: t`February`,
    },
    {
      value: 'March',
      text: t`March`,
    },
    {
      value: 'April',
      text: t`April`,
    },
    {
      value: 'May',
      text: t`May`,
    },
    {
      value: 'June',
      text: t`June`,
    },
    {
      value: 'July',
      text: t`July`,
    },
    {
      value: 'August',
      text: t`August`,
    },
    {
      value: 'September',
      text: t`September`,
    },
    {
      value: 'October',
      text: t`October`,
    },
    {
      value: 'November',
      text: t`November`,
    },
    {
      value: 'December',
      text: t`December`,
    },
  ]
  const options = [
    <option
      key="LAST30DAYS"
      value={`LAST30DAYS, ${currentDate.getFullYear().toString()}`}
    >
      {t`Last 30 Days`}
    </option>,
  ]

  // add dmarc date selection options
  for (let i = currentDate.getMonth(), j = 13; j > 0; i--, j--) {
    // handle previous year
    if (i < 0) {
      const value = `${months[months.length + i].value.toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`
      const translatedValue = `${months[
        months.length + i
      ].text.toUpperCase()}, ${currentDate.getFullYear() - 1}`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
    // handle current year
    else {
      const value = `${months[
        i
      ].value.toUpperCase()}, ${currentDate.getFullYear()}`
      const translatedValue = `${months[
        i
      ].text.toUpperCase()}, ${currentDate.getFullYear()}`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
  }

  return (
    <Select {...props} value={selectedValue} onChange={(e) => handleChange(e)}>
      {options}
    </Select>
  )
}

MonthSelect.propTypes = {
  selectedValue: any,
  handleChange: func,
}
