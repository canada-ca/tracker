import React, { useState } from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import {
  DMARC_REPORT_GRAPH,
  PAGINATED_DKIM_FAILURE_REPORT as DKIM_FAILURE_FORWARD,
  PAGINATED_DMARC_FAILURE_REPORT as DMARC_FAILURE_FORWARD,
  PAGINATED_FULL_PASS_REPORT as FULL_PASS_FORWARD,
  PAGINATED_SPF_FAILURE_REPORT as SPF_FAILURE_FORWARD,
} from './graphql/queries'
import DmarcTimeGraph from './DmarcReportSummaryGraph'
import {
  Box,
  Heading,
  Icon,
  Link,
  PseudoBox,
  Select,
  Stack,
  Text,
} from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number } from 'prop-types'
import { Link as RouteLink, useHistory, useParams } from 'react-router-dom'
import { months } from './months'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { LoadingMessage } from './LoadingMessage'
import { useDocumentTitle } from './useDocumentTitle'
import { Layout } from './Layout'

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { domainSlug, period, year } = useParams()
  const history = useHistory()
  const { i18n } = useLingui()

  useDocumentTitle(t`DMARC Report for ${domainSlug}`)

  const currentDate = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedDate, setSelectedDate] = useState(
    `${selectedPeriod}, ${selectedYear}`,
  )

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

  const { loading: dkimLoading, error: dkimError, data: dkimData } = useQuery(
    DKIM_FAILURE_FORWARD,
    {
      context: {
        headers: { authorization: currentUser.jwt },
      },
      variables: {
        month: selectedPeriod,
        year: selectedYear,
        domain: domainSlug,
        first: 50,
        after: '',
      },
    },
  )

  const {
    loading: dmarcFailureLoading,
    error: dmarcFailureError,
    data: dmarcFailureData,
  } = useQuery(DMARC_FAILURE_FORWARD, {
    context: {
      headers: { authorization: currentUser.jwt },
    },
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
      first: 50,
      after: '',
    },
  })

  const {
    loading: spfFailureLoading,
    error: spfFailureError,
    data: spfFailureData,
  } = useQuery(SPF_FAILURE_FORWARD, {
    context: {
      headers: { authorization: currentUser.jwt },
    },
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
      first: 50,
      after: '',
    },
  })

  const {
    loading: fullPassLoading,
    error: fullPassError,
    data: fullPassData,
  } = useQuery(FULL_PASS_FORWARD, {
    context: {
      headers: { authorization: currentUser.jwt },
    },
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
      first: 50,
      after: '',
    },
  })

  if (!graphData?.findDomainByDomain?.hasDMARCReport) {
    return (
      <Layout>
        <Stack align="center">
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
            <Trans>This Domain does not support aggregate data</Trans>
          </Text>
        </Stack>
      </Layout>
    )
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

  // DMARC bar graph setup
  let graphDisplay

  // Set DMARC bar graph Loading
  if (graphLoading) {
    graphDisplay = (
      <LoadingMessage>
        <Trans>Yearly DMARC Graph</Trans>
      </LoadingMessage>
    )
  }
  // Display graph query error if found
  else if (graphError) {
    graphDisplay = <ErrorFallbackMessage error={graphError} />
  }
  // Set graph display using data if data exists
  else if (graphData?.findDomainByDomain?.yearlyDmarcSummaries?.length > 0) {
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
  // If no data exists for DMARC graph, display message saying so
  else {
    graphDisplay = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DMARC yearly report graph</Trans> *
      </Heading>
    )
  }

  const sourceIpAddress = {
    Header: i18n._(t`Source IP Address`),
    accessor: 'sourceIpAddress',
    style: { whiteSpace: 'nowrap' },
  }
  const envelopeFrom = {
    Header: i18n._(t`Envelope From`),
    accessor: 'envelopeFrom',
    style: { whiteSpace: 'nowrap' },
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
    Cell: ({ value }) => value.toLocaleString(i18n.locale),
    style: { textAlign: 'right' },
  }
  const dnsHost = { Header: i18n._(t`DNS Host`), accessor: 'dnsHost' }
  const spfDomains = {
    Header: i18n._(t`SPF Domains`),
    accessor: 'spfDomains',
  }
  const headerFrom = {
    Header: i18n._(t`Header From`),
    accessor: 'headerFrom',
    style: { whiteSpace: 'nowrap' },
  }
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

  // Initial sorting category for detail tables
  const initialSort = [{ id: 'totalMessages', desc: true }]

  // DKIM Failure Table setup
  let dkimFailureTable

  // Set DKIM Failure Table Loading
  if (dkimLoading) {
    dkimFailureTable = (
      <LoadingMessage>
        <Trans>DKIM Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // DKIM Failure query no longer loading, check if data exists
  else if (
    dkimData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
      ?.dkimFailure?.edges.length > 0
  ) {
    const dkimFailureColumns = [
      {
        Header: t`DKIM Failures by IP Address`,
        hidden: true,
        columns: [
          sourceIpAddress,
          dnsHost,
          envelopeFrom,
          headerFrom,
          dkimDomains,
          dkimSelectors,
          dkimResults,
          dkimAligned,
          totalMessages,
          guidance,
        ],
      },
    ]

    // Convert boolean values to string and properly format
    const dkimFailureNodes = dkimData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.dkimFailure.edges.map(
      (edge) => {
        const node = { ...edge.node }
        node.dkimAligned = node.dkimAligned.toString()
        return node
      },
    )

    dkimFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          mt="30px"
          data={dkimFailureNodes}
          columns={dkimFailureColumns}
          title={t`DKIM Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
        />
      </ErrorBoundary>
    )
  }
  // Display DKIM Failure if found
  else if (dkimError) {
    dkimFailureTable = <ErrorFallbackMessage error={dkimError} />
  }
  // If no data exists for DKIM Failure table, display message saying so
  else {
    dkimFailureTable = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DKIM Failures by IP Address table</Trans> *
      </Heading>
    )
  }

  // Fully Aligned Table setup
  let fullPassTable

  // Set Fully Aligned Table Loading
  if (fullPassLoading) {
    fullPassTable = (
      <LoadingMessage>
        <Trans>Fully Aligned Table</Trans>
      </LoadingMessage>
    )
  }
  // Full pass query no longer loading, check if data exists
  else if (
    fullPassData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
      ?.fullPass?.edges.length > 0
  ) {
    const fullPassColumns = [
      {
        Header: t`Fully Aligned by IP Address`,
        hidden: true,
        columns: [
          sourceIpAddress,
          dnsHost,
          envelopeFrom,
          headerFrom,
          spfDomains,
          dkimDomains,
          dkimSelectors,
          totalMessages,
        ],
      },
    ]

    // Convert boolean values to string and properly format
    const fullPassNodes = fullPassData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.fullPass.edges.map(
      (edge) => {
        return { ...edge.node }
      },
    )

    fullPassTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={fullPassNodes}
          columns={fullPassColumns}
          title={t`Fully Aligned by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
        />
      </ErrorBoundary>
    )
  }
  // Display Fully Aligned Error if found
  else if (fullPassError) {
    fullPassTable = <ErrorFallbackMessage error={fullPassError} />
  }
  // If no data exists for Fully Aligned table, display message saying so
  else {
    fullPassTable = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the Fully Aligned by IP Address table</Trans> *
      </Heading>
    )
  }

  // SPF Failure Table setup
  let spfFailureTable

  // Set SPF Failure Table Loading
  if (spfFailureLoading) {
    spfFailureTable = (
      <LoadingMessage>
        <Trans>SPF Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // SPF Failure query no longer loading, check if data exists
  else if (
    spfFailureData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
      ?.spfFailure?.edges.length > 0
  ) {
    const spfFailureColumns = [
      {
        Header: t`SPF Failures by IP Address`,
        hidden: true,
        columns: [
          sourceIpAddress,
          dnsHost,
          envelopeFrom,
          headerFrom,
          spfDomains,
          spfResults,
          spfAligned,
          totalMessages,
          guidance,
        ],
      },
    ]
    // Convert boolean values to string and properly format
    const spfFailureNodes = spfFailureData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.spfFailure.edges.map(
      (edge) => {
        const node = { ...edge.node }
        node.spfAligned = node.spfAligned.toString()
        return node
      },
    )

    spfFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          mt="30px"
          data={spfFailureNodes}
          columns={spfFailureColumns}
          title={t`SPF Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
        />
      </ErrorBoundary>
    )
  }
  // Display SPF Failure if found
  else if (spfFailureError) {
    spfFailureTable = <ErrorFallbackMessage error={spfFailureError} />
  }
  // If no data exists for SPF Failure table, display message saying so
  else {
    spfFailureTable = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the SPF Failures by IP Address table</Trans> *
      </Heading>
    )
  }

  // DMARC Failure Table setup
  let dmarcFailureTable

  // Set DMARC Failure Table Loading
  if (dmarcFailureLoading) {
    dmarcFailureTable = (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // DMARC Failure query no longer loading, check if data exists
  else if (
    dmarcFailureData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
      ?.dmarcFailure?.edges.length > 0
  ) {
    const dmarcFailureColumns = [
      {
        Header: t`DMARC Failures by IP Address`,
        hidden: true,
        columns: [
          sourceIpAddress,
          dnsHost,
          envelopeFrom,
          headerFrom,
          spfDomains,
          dkimDomains,
          dkimSelectors,
          disposition,
          totalMessages,
        ],
      },
    ]

    // Convert boolean values to string and properly format
    const dmarcFailureNodes = dmarcFailureData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.dmarcFailure.edges.map(
      (edge) => {
        return { ...edge.node }
      },
    )

    dmarcFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          mt="30px"
          data={dmarcFailureNodes}
          columns={dmarcFailureColumns}
          title={t`DMARC Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
        />
      </ErrorBoundary>
    )
  }
  // Display DMARC Failure if found
  else if (dmarcFailureError) {
    dmarcFailureTable = <ErrorFallbackMessage error={dmarcFailureError} />
  }
  // If no data exists for DMARC Failure table, display message saying so
  else {
    dmarcFailureTable = (
      <Heading as="h3" size="lg">
        * <Trans>No data for the DMARC Failures by IP Address table</Trans> *
      </Heading>
    )
  }

  const tableDisplay = (
    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
      {fullPassTable}
      {spfFailureTable}
      {dkimFailureTable}
      {dmarcFailureTable}
    </ErrorBoundary>
  )

  return (
    <Box width="100%" px="2" mx="auto" overflow="hidden" pb="4">
      <PseudoBox d={{ md: 'grid' }} gridTemplateColumns={{ md: '1fr 1fr 1fr' }}>
        <Box />
        <Heading as="h1" textAlign="center">
          {domainSlug.toUpperCase()}
        </Heading>
        <Link
          color="teal.500"
          whiteSpace="noWrap"
          my="auto"
          to={`/domains/${domainSlug}`}
          as={RouteLink}
          d="block"
          width="100%"
          textAlign={{ base: 'center', md: 'right' }}
        >
          <Trans>Guidance</Trans>
          <Icon name="link" ml="4px" />
        </Link>
      </PseudoBox>

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
