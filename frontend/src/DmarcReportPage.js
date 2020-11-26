import React, { useState, useEffect } from 'react'
import { useUserState } from './UserState'
import { useQuery, useLazyQuery } from '@apollo/client'
import {
  DMARC_REPORT_DETAIL_TABLES,
  DMARC_REPORT_GRAPH,
  DMARC_REPORT_PAGE,
  PAGINATED_DKIM_FAILURE_REPORT as DKIM_FAILURE_FORWARD,
  REVERSE_PAGINATED_DKIM_FAILURE_REPORT as DKIM_FAILURE_BACKWARD,
  PAGINATED_DMARC_FAILURE_REPORT as DMARC_FAILURE_FORWARD,
  REVERSE_PAGINATED_DMARC_FAILURE_REPORT as DMARC_FAILURE_BACKWARD,
  PAGINATED_SPF_FAILURE_REPORT as SPF_FAILURE_FORWARD,
  REVERSE_PAGINATED_SPF_FAILURE_REPORT as SPF_FAILURE_BACKWARD,
  PAGINATED_FULL_PASS_REPORT as FULL_PASS_FORWARD,
  REVERSE_PAGINATED_FULL_PASS_REPORT as FULL_PASS_BACKWARD,
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
import { usePaginatedCollection } from './usePaginatedCollection'
import { RelayPaginationControls } from './RelayPaginationControls'

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
  const [tableData, setTableData] = useState()
  const [reportCalled, setReportCalled] = useState(false)

  const defaultPageSize = 10
  const [
    dmarcFailureSelectedTableDisplayLimit,
    setDmarcFailureSelectedTableDisplayLimit,
  ] = useState(defaultPageSize)
  const [
    dkimFailureSelectedTableDisplayLimit,
    setDkimFailureSelectedTableDisplayLimit,
  ] = useState(defaultPageSize)
  const [
    spfFailureSelectedTableDisplayLimit,
    setSpfFailureSelectedTableDisplayLimit,
  ] = useState(defaultPageSize)
  const [
    fullPassSelectedTableDisplayLimit,
    setFullPassSelectedTableDisplayLimit,
  ] = useState(defaultPageSize)

  // Allows the use of forward/backward navigation
  if (selectedPeriod !== period) setSelectedPeriod(period)
  if (selectedYear !== year) setSelectedPeriod(year)
  if (selectedDate !== `${period}, ${year}`)
    setSelectedDate(`${period}, ${year}`)

  const {
    loading: graphLoading,
    error: graphError,
    data: graphData,
  } = useQuery(DMARC_REPORT_GRAPH, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      domain: domainSlug,
    },
  })

  let {
    loading: dkimFailureLoading,
    error: dkimFailureError,
    nodes: dkimFailureNodes,
    next: dkimFailureNext,
    previous: dkimFailurePrevious,
    hasNextPage: dkimFailureHasNextPage,
    hasPreviousPage: dkimFailureHasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: DKIM_FAILURE_FORWARD,
    fetchBackward: DKIM_FAILURE_BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: 10,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
    },
    relayRoot: 'dmarcSummaryByPeriod.detailTables.dkimFailure',
  })

  const {
    loading: dmarcFailureLoading,
    error: dmarcFailureError,
    nodes: dmarcFailureNodes,
    next: dmarcFailureNext,
    previous: dmarcFailurePrevious,
    hasNextPage: dmarcFailureHasNextPage,
    hasPreviousPage: dmarcFailureHasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: DMARC_FAILURE_FORWARD,
    fetchBackward: DMARC_FAILURE_BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: 10,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
    },
    relayRoot: 'dmarcSummaryByPeriod.detailTables.dmarcFailure',
  })

  let {
    loading: spfFailureLoading,
    error: spfFailureError,
    nodes: spfFailureNodes,
    next: spfFailureNext,
    previous: spfFailurePrevious,
    hasNextPage: spfFailureHasNextPage,
    hasPreviousPage: spfFailureHasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: SPF_FAILURE_FORWARD,
    fetchBackward: SPF_FAILURE_BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: 10,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
    },
    relayRoot: 'dmarcSummaryByPeriod.detailTables.spfFailure',
  })

  const {
    loading: fullPassLoading,
    error: fullPassError,
    nodes: fullPassNodes,
    next: fullPassNext,
    previous: fullPassPrevious,
    hasNextPage: fullPassHasNextPage,
    hasPreviousPage: fullPassHasPreviousPage,
  } = usePaginatedCollection({
    fetchForward: FULL_PASS_FORWARD,
    fetchBackward: FULL_PASS_BACKWARD,
    fetchHeaders: { authorization: currentUser.jwt },
    recordsPerPage: 10,
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
    },
    relayRoot: 'dmarcSummaryByPeriod.detailTables.fullPass',
  })

  if (graphLoading)
    return (
      <LoadingMessage>
        <Trans>Yearly DMARC Data</Trans>
      </LoadingMessage>
    )

  if (dkimFailureLoading)
    return (
      <LoadingMessage>
        <Trans>DKIM Failure Table</Trans>
      </LoadingMessage>
    )

  if (dmarcFailureLoading)
    return (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )

  if (spfFailureLoading)
    return (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )

  if (fullPassLoading)
    return (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )

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
      periods: graphData.findDomainByDomain.yearlyDmarcSummaries.map(
        (entry) => {
          return {
            month: entry.month,
            year: entry.year,
            ...entry.categoryTotals,
          }
        },
      ),
    }
    formattedGraphData.strengths = strengths
    graphDisplay = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcTimeGraph
          data={formattedGraphData}
          width="100%"
          mr="400px"
          responsiveWidth={summaryListResponsiveWidth}
        />
      </ErrorBoundary>
    )
  }

  // Create report tables if no errors and message data exist
  let tableDisplay
  if (dkimFailureNodes || dmarcFailureNodes) {
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
    // Convert boolean values to string
    spfFailureNodes = spfFailureNodes.map((node) => {
      return { ...node, spfAligned: node.spfAligned.toString() }
    })

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
    // Convert boolean values to string
    dkimFailureNodes = dkimFailureNodes.map((node) => {
      return {
        ...node,
        dkimAligned: node.dkimAligned.toString(),
      }
    })

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

    const displayLimitOptions = [5, 10, 20, 50, 100]

    const fullPassPaginationConfig = {
      previous: fullPassPrevious,
      hasPreviousPage: fullPassHasPreviousPage,
      next: fullPassNext,
      hasNextPage: fullPassHasNextPage,
      displayLimitOptions: displayLimitOptions,
    }
    const fullyAlignedTable = fullPassNodes.length ? (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={fullPassNodes}
          columns={fullPassColumns}
          title={t`Fully Aligned by IP Address`}
          initialSort={initialSort}
          frontendPagination={false}
          paginationConfig={fullPassPaginationConfig}
          selectedDisplayLimit={fullPassSelectedTableDisplayLimit}
          setSelectedDisplayLimit={setFullPassSelectedTableDisplayLimit}
        />
      </ErrorBoundary>
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the Fully Aligned by IP Address table</Trans> *
      </Heading>
    )

    const spfFailurePaginationConfig = {
      previous: spfFailurePrevious,
      hasPreviousPage: spfFailureHasPreviousPage,
      next: spfFailureNext,
      hasNextPage: spfFailureHasNextPage,
      displayLimitOptions: displayLimitOptions,
    }
    const spfFailureTable = spfFailureNodes.length ? (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={spfFailureNodes}
          columns={spfFailureColumns}
          title={t`SPF Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={false}
          paginationConfig={spfFailurePaginationConfig}
          selectedDisplayLimit={spfFailureSelectedTableDisplayLimit}
          setSelectedDisplayLimit={setSpfFailureSelectedTableDisplayLimit}
        />
      </ErrorBoundary>
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the SPF Failures by IP Address table</Trans> *
      </Heading>
    )

    const dkimFailurePaginationConfig = {
      previous: dkimFailurePrevious,
      hasPreviousPage: dkimFailureHasPreviousPage,
      next: dkimFailureNext,
      hasNextPage: dkimFailureHasNextPage,
      displayLimitOptions: displayLimitOptions,
    }
    const dkimFailureTable = dkimFailureNodes.length ? (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={dkimFailureNodes}
          columns={dkimFailureColumns}
          title={t`DKIM Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={false}
          paginationConfig={dkimFailurePaginationConfig}
          selectedDisplayLimit={dkimFailureSelectedTableDisplayLimit}
          setSelectedDisplayLimit={setDkimFailureSelectedTableDisplayLimit}
        />
      </ErrorBoundary>
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DKIM Failures by IP Address table</Trans> *
      </Heading>
    )

    const dmarcFailurePaginationConfig = {
      previous: dmarcFailurePrevious,
      hasPreviousPage: dmarcFailureHasPreviousPage,
      next: dmarcFailureNext,
      hasNextPage: dmarcFailureHasNextPage,
      displayLimitOptions: displayLimitOptions,
    }
    const dmarcFailureTable = dmarcFailureNodes.length ? (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={dmarcFailureNodes}
          columns={dmarcFailureColumns}
          title={t`DMARC Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={false}
          paginationConfig={dmarcFailurePaginationConfig}
          selectedDisplayLimit={dmarcFailureSelectedTableDisplayLimit}
          setSelectedDisplayLimit={setDmarcFailureSelectedTableDisplayLimit}
        />
      </ErrorBoundary>
    ) : (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DMARC Failures by IP Address table</Trans> *
      </Heading>
    )

    tableDisplay = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <Stack spacing="30px">
          {fullyAlignedTable}
          {spfFailureTable}
          {dkimFailureTable}
          {dmarcFailureTable}
        </Stack>
      </ErrorBoundary>
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

      {graphDisplay}

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

      {tableDisplay}
    </Box>
  )
}

DmarcReportPage.propTypes = {
  // Need to allow summaryList ResponsiveContainer width as a set number for tests to work
  summaryListResponsiveWidth: number,
}
