import React, { useState } from 'react'
import { useUserState } from './UserState'
import { PAGINATED_DMARC_REPORT_SUMMARY_TABLE as FORWARD } from './graphql/queries'
import { Box, Heading, Select, Stack, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { months } from './months'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { usePaginatedCollection } from './usePaginatedCollection'

export default function DmarcByDomainPage() {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()
  const currentDate = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState('LAST30DAYS')
  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear().toString(),
  )
  const [selectedDate, setSelectedDate] = useState(
    `LAST30DAYS, ${currentDate.getFullYear()}`,
  )
  const [selectedTableDisplayLimit, setSelectedTableDisplayLimit] = useState(10)

  const {
    loading,
    error,
    nodes,
    next,
    previous,
    hasNextPage,
    hasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FORWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: selectedTableDisplayLimit,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
    },
    relayRoot: 'findMyDomains',
  })

  if (error) return <ErrorFallbackMessage error={error} />

  // DMARC Summary Table setup
  let tableDisplay

  // Display loading message
  if (loading) {
    tableDisplay = (
      <LoadingMessage>
        <Trans>Domains Table</Trans>
      </LoadingMessage>
    )
  }
  // If not loading and data exists, show table
  else if (nodes.length > 0) {
    const formattedData = []
    nodes.forEach((node) => {
      const domain = node.domain
      const percentages = { ...node.dmarcSummaryByPeriod.categoryPercentages }
      Object.entries(percentages).forEach(([key, value]) => {
        if (typeof value === 'number') percentages[key] = Math.round(value)
      })
      formattedData.push({ domain, ...percentages })
    })

    // Initial sorting category for detail tables
    const initialSort = [{ id: 'totalMessages', desc: true }]

    const [
      domain,
      totalMessages,
      fullPassPercentage,
      passSpfOnlyPercentage,
      passDkimOnlyPercentage,
      failPercentage,
    ] = [
      {
        Header: i18n._(t`Domain`),
        accessor: 'domain',
      },
      {
        Header: i18n._(t`Total Messages`),
        accessor: 'totalMessages',
        Cell: ({ value }) => value.toLocaleString(i18n.locale),
        style: { textAlign: 'right' },
      },
      {
        Header: i18n._(t`Full Pass %`),
        accessor: 'fullPassPercentage',
        Cell: ({ value }) => `${value}%`,
        style: { textAlign: 'right' },
      },
      {
        Header: i18n._(t`Fail DKIM %`),
        accessor: 'passSpfOnlyPercentage',
        Cell: ({ value }) => `${value}%`,
        style: { textAlign: 'right' },
      },
      {
        Header: i18n._(t`Fail SPF %`),
        accessor: 'passDkimOnlyPercentage',
        Cell: ({ value }) => `${value}%`,
        style: { textAlign: 'right' },
      },
      {
        Header: i18n._(t`Full Fail %`),
        accessor: 'failPercentage',
        Cell: ({ value }) => `${value}%`,
        style: { textAlign: 'right' },
      },
    ]

    const percentageColumns = [
      {
        Header: i18n._(t`DMARC Messages`),
        hidden: true,
        columns: [
          domain,
          totalMessages,
          fullPassPercentage,
          passDkimOnlyPercentage,
          passSpfOnlyPercentage,
          failPercentage,
        ],
      },
    ]

    const displayLimitOptions = [5, 10, 20, 50, 100]
    const paginationConfig = {
      previous: previous,
      hasPreviousPage: hasPreviousPage,
      next: next,
      hasNextPage: hasNextPage,
      displayLimitOptions: displayLimitOptions,
    }

    tableDisplay = (
      <DmarcReportTable
        data={formattedData}
        columns={percentageColumns}
        title={i18n._(t`Pass/Fail Ratios by Domain`)}
        initialSort={initialSort}
        mb="10px"
        hideTitleButton={true}
        linkColumns={[{ column: 'domain', isExternal: false }]}
        prependLink="domains/"
        appendLink={`/dmarc-report/${selectedPeriod}/${selectedYear}`}
        frontendPagination={false}
        paginationConfig={paginationConfig}
        selectedDisplayLimit={selectedTableDisplayLimit}
        setSelectedDisplayLimit={setSelectedTableDisplayLimit}
      />
    )
  }
  // Display error if exists
  else if (error) {
    tableDisplay = <ErrorFallbackMessage error={error} />
  }
  // If not loading, no error, and no data, no data exists. Show message
  else {
    tableDisplay = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DMARC summary table</Trans> *
      </Heading>
    )
  }

  const handleChange = (e) => {
    setSelectedDate(e.target.value)
    const [newPeriod, newYear] = e.target.value.split(', ')
    setSelectedPeriod(newPeriod)
    setSelectedYear(newYear)
  }

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
      const value = `${months[months.length + i].toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`
      const translatedValue = `${months[months.length + i].toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
    // handle current year
    else {
      const value = `${months[i].toUpperCase()}, ${currentDate.getFullYear()}`
      const translatedValue = `${months[
        i
      ].toUpperCase()}, ${currentDate.getFullYear()}`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
  }

  return (
    <Box width="100%">
      <Heading as="h1" textAlign="center" size="lg" mb="4px">
        <Trans>DMARC Messages</Trans>
      </Heading>

      <Stack isInline align="center" mb="4px">
        <Text fontWeight="bold" textAlign="center">
          <Trans>Showing data for period: </Trans>
        </Text>
        <Select
          width="fit-content"
          onChange={(e) => handleChange(e)}
          value={selectedDate}
        >
          {options}
        </Select>
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        {tableDisplay}
      </ErrorBoundary>
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
