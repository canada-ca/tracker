import React, { useState, useEffect } from 'react'
import { useUserState } from './UserState'
import { useQuery, useLazyQuery } from '@apollo/client'
import {
  DMARC_REPORT_DETAIL_TABLES,
  DMARC_REPORT_PAGE,
} from './graphql/queries'
import DmarcTimeGraph from './DmarcReportSummaryGraph'
import { Box, Heading, IconButton, Select, Stack, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number } from 'prop-types'
import { useParams, useHistory } from 'react-router-dom'
import { months } from './months'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { domainSlug, period, year } = useParams()
  const history = useHistory()
  const { i18n } = useLingui()

  const currentDate = new Date()
  const [originalPeriod] = useState(period)
  const [originalYear] = useState(year)
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedDate, setSelectedDate] = useState(
    `${selectedPeriod}, ${selectedYear}`,
  )
  const [graphData, setGraphData] = useState()
  const [tableData, setTableData] = useState()
  const [reportCalled, setReportCalled] = useState(false)

  // Allows the use of forward/backward navigation
  if (selectedPeriod !== period) setSelectedPeriod(period)
  if (selectedYear !== year) setSelectedPeriod(year)
  if (selectedDate !== `${period}, ${year}`)
    setSelectedDate(`${period}, ${year}`)

  const {
    loading: reportLoading,
    error: _reportError,
    data: reportData,
  } = useQuery(DMARC_REPORT_PAGE, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      domain: domainSlug,
      month: originalPeriod,
      year: originalYear,
    },
    skip: reportCalled,
    onCompleted() {
      setReportCalled(true)
      setTableData(
        reportData.findDomainByDomain.dmarcSummaryByPeriod.detailTables,
      )
      setGraphData(reportData.findDomainByDomain.yearlyDmarcSummaries)
    },
    onError() {
      setReportCalled(true)
    },
  })

  const [
    getTables,
    { loading: _tableLoading, error: _tableError, data: tableReturnData },
  ] = useLazyQuery(DMARC_REPORT_DETAIL_TABLES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      domain: domainSlug,
      month: selectedPeriod,
      year: selectedYear,
    },
    onCompleted() {
      setTableData(
        tableReturnData.findDomainByDomain.dmarcSummaryByPeriod.detailTables,
      )
    },
  })

  useEffect(() => {
    if (reportCalled) getTables()
  }, [selectedPeriod, selectedYear, getTables])

  if (reportLoading) return       <LoadingMessage>
        <Trans>DMARC Report</Trans>
      </LoadingMessage>

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

  // Show data for newly selected date
  const handleChange = (e) => {
    setSelectedDate(e.target.value)
    const [newPeriod, newYear] = e.target.value.split(', ')
    setSelectedPeriod(newPeriod)
    setSelectedYear(newYear)
    history.replace(
      `/domains/${domainSlug}/dmarc-report/${newPeriod}/${newYear}`,
    )
  }

  // Create dmarc bar graph if not loading and no errors
  let graphDisplay
  if (graphData) {
    const strengths = {
      strong: [
        {
          name: 'fullPass',
          displayName: t`Pass`,
        },
      ],
      moderate: [
        {
          name: 'passSpfOnly',
          displayName: t`Pass Only SPF`,
        },
      ],
      moderateAlt: [
        {
          name: 'passDkimOnly',
          displayName: t`Pass Only DKIM`,
        },
      ],
      weak: [
        {
          name: 'fail',
          displayName: t`Fail`,
        },
      ],
    }
    const formattedGraphData = {
      periods: graphData.map((entry) => {
        return { month: entry.month, year: entry.year, ...entry.categoryTotals }
      }),
    }
    formattedGraphData.strengths = strengths
    graphDisplay = (
      <DmarcTimeGraph
        data={formattedGraphData}
        width="100%"
        mr="400px"
        responsiveWidth={summaryListResponsiveWidth}
      />
    )
  }

  // Create report tables if no errors and message data exist
  let tableDisplay
  if (tableData) {
    const fullPassData = []
    tableData.fullPass.edges.forEach((edge) => {
      fullPassData.push(edge.node)
    })
    const spfFailureData = []
    tableData.spfFailure.edges.forEach((edge) => {
      spfFailureData.push(edge.node)
    })
    const dkimFailureData = []
    tableData.dkimFailure.edges.forEach((edge) => {
      dkimFailureData.push(edge.node)
    })
    const dmarcFailureData = []
    tableData.dmarcFailure.edges.forEach((edge) => {
      dmarcFailureData.push(edge.node)
    })

    // Initial sorting category for detail tables
    const initialSort = [{ id: 'totalMessages', desc: true }]

    const sourceIpAddress = {
      Header: i18n._(t`Source IP Address`),
      accessor: 'sourceIpAddress',
    }
    const envelopeFrom = {
      Header: i18n._(t`Envelope From`),
      accessor: 'envelopeFrom',
    }
    const dkimDomains = {
      Header: i18n._(t`DKIM Domains`),
      accessor: 'dkimDomains',
    }
    const dkimSelectors = {
      Header: i18n._(t`DKIM Selectors`),
      accessor: 'dkimSelectors',
    }
    const totalMessages = {
      Header: i18n._(t`Total Messages`),
      accessor: 'totalMessages',
    }
    const dnsHost = { Header: i18n._(t`DNS Host`), accessor: 'dnsHost' }
    const spfDomains = {
      Header: i18n._(t`SPF Domains`),
      accessor: 'spfDomains',
    }
    const headerFrom = { Header: i18n._(t`Head From`), accessor: 'headerFrom' }
    const guidance = { Header: i18n._(t`Guidance`), accessor: 'guidance' }
    const spfAligned = {
      Header: i18n._(t`SPF Aligned`),
      accessor: 'spfAligned',
    }
    const spfResults = {
      Header: i18n._(t`SPF Results`),
      accessor: 'spfResults',
    }
    const dkimAligned = {
      Header: i18n._(t`DKIM Aligned`),
      accessor: 'dkimAligned',
    }
    const dkimResults = {
      Header: i18n._(t`DKIM Results`),
      accessor: 'dkimResults',
    }
    const disposition = {
      Header: i18n._(t`Disposition`),
      accessor: 'disposition',
    }

    const fullPassColumns = [
      {
        Header: t`Fully Aligned by IP Address`,
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          dkimDomains,
          dkimSelectors,
          dnsHost,
          headerFrom,
          spfDomains,
          totalMessages,
        ],
      },
    ]

    const spfFailureColumns = [
      {
        Header: t`SPF Failures by IP Address`,
        hidden: true,
        columns: [
          dnsHost,
          envelopeFrom,
          guidance,
          headerFrom,
          sourceIpAddress,
          spfAligned,
          spfDomains,
          spfResults,
          totalMessages,
        ],
      },
    ]

    const dkimFailureColumns = [
      {
        Header: t`DKIM Failures by IP Address`,
        hidden: true,
        columns: [
          dkimAligned,
          dkimDomains,
          dkimResults,
          dkimSelectors,
          dnsHost,
          envelopeFrom,
          guidance,
          headerFrom,
          sourceIpAddress,
          totalMessages,
        ],
      },
    ]

    const dmarcFailureColumns = [
      {
        Header: t`DMARC Failures by IP Address`,
        hidden: true,
        columns: [
          dkimDomains,
          dkimSelectors,
          disposition,
          dnsHost,
          envelopeFrom,
          headerFrom,
          sourceIpAddress,
          spfDomains,
          totalMessages,
        ],
      },
    ]
    const fullyAlignedTable = fullPassData.length ? (
      <DmarcReportTable
        data={fullPassData}
        columns={fullPassColumns}
        title={t`Fully Aligned by IP Address`}
        initialSort={initialSort}
        mb="8"
      />
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the Fully Aligned by IP Address table</Trans> *
      </Heading>
    )
    const spfFailureTable = spfFailureData.length ? (
      <DmarcReportTable
        data={spfFailureData}
        columns={spfFailureColumns}
        title={t`SPF Failures by IP Address`}
        initialSort={initialSort}
      />
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the SPF Failures by IP Address table</Trans> *
      </Heading>
    )
    const dkimFailureTable = dkimFailureData.length ? (
      <DmarcReportTable
        data={dkimFailureData}
        columns={dkimFailureColumns}
        title={t`DKIM Failures by IP Address`}
        initialSort={initialSort}
      />
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DKIM Failures by IP Address table</Trans> *
      </Heading>
    )
    const dmarcFailureTable = dkimFailureData.length ? (
      <DmarcReportTable
        data={dmarcFailureData}
        columns={dmarcFailureColumns}
        title={t`DMARC Failures by IP Address`}
        initialSort={initialSort}
      />
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DMARC Failures by IP Address table</Trans> *
      </Heading>
    )

    tableDisplay = (
      <Stack spacing="30px">
        {fullyAlignedTable}
        {spfFailureTable}
        {dkimFailureTable}
        {dmarcFailureTable}
      </Stack>
    )
  }

  return (
    <Box width="100%" px="4" mx="auto" overflow="hidden">
      <Stack isInline align="center">
        <IconButton
          icon="arrow-left"
          onClick={history.goBack}
          color="gray.900"
          fontSize="2xl"
          aria-label="back to dmarc summaries"
          align="left"
        />
        <Heading as="h1" textAlign="center">
          {domainSlug.toUpperCase()}
        </Heading>
      </Stack>

<ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
      {graphDisplay}
      </ErrorBoundary>

      <Stack isInline align="center" mb="16px">
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

DmarcReportPage.propTypes = {
  // Need to allow summaryList ResponsiveContainer width as a set number for tests to work
  summaryListResponsiveWidth: number,
}
