import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { DMARC_REPORT_GRAPH, PAGINATED_DMARC_REPORT } from './graphql/queries'
import {
  Box,
  Divider,
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
import { InfoBox, InfoPanel } from './InfoPanel'
import { DmarcReportSummaryGraph } from './DmarcReportSummaryGraph'

export default function DmarcReportPage() {
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

  const [fullPassState, changeFullPassState] = React.useState({
    isHidden: true,
  })
  const [failDkimState, changeFailDkimState] = React.useState({
    isHidden: true,
  })
  const [failSpfState, changeFailSpfState] = React.useState({
    isHidden: true,
  })
  const [fullFailState, changeFullFailState] = React.useState({
    isHidden: true,
  })

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
    variables: {
      domain: domainSlug,
    },
  })

  const {
    loading: tableLoading,
    error: tableError,
    data: tableData,
  } = useQuery(PAGINATED_DMARC_REPORT, {
    variables: {
      month: selectedPeriod,
      year: selectedYear,
      domain: domainSlug,
      first: 50,
      after: '',
    },
  })

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

  if (!graphData?.findDomainByDomain?.hasDMARCReport) {
    return (
      <Layout>
        <Stack align="center">
          <Text textAlign="center" fontSize="3xl" fontWeight="bold">
            <Trans>This domain does not support aggregate data</Trans>
          </Text>
        </Stack>
      </Layout>
    )
  }

  // Display graph query error if found
  else if (graphError) {
    graphDisplay = <ErrorFallbackMessage error={graphError} />
  }
  // Set graph display using data if data exists
  else if (graphData?.findDomainByDomain?.yearlyDmarcSummaries?.length > 0) {
    const strengths = {
      fullPass: t`Pass`,
      fullPassPercentage: t`Pass`,

      passSpfOnly: t`Fail DKIM`,
      passSpfOnlyPercentage: t`Fail DKIM`,

      passDkimOnly: t`Fail SPF`,
      passDkimOnlyPercentage: t`Fail SPF`,

      fail: t`Fail`,
      failPercentage: t`Fail`,
    }

    const formattedGraphData = {
      periods: graphData.findDomainByDomain.yearlyDmarcSummaries.map(
        (entry) => {
          return {
            month: entry.month,
            year: entry.year,
            ...entry.categoryTotals,
            ...entry.categoryPercentages,
          }
        },
      ),
    }
    formattedGraphData.strengths = strengths
    graphDisplay = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportSummaryGraph data={formattedGraphData} />
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
  if (tableLoading) {
    dkimFailureTable = (
      <LoadingMessage>
        <Trans>DKIM Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // DKIM Failure query no longer loading, check if data exists
  else if (
    tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
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
    const dkimFailureNodes = tableData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.dkimFailure.edges.map(
      (edge) => {
        const node = { ...edge.node }
        node.dkimAligned = node.dkimAligned.toString()
        return node
      },
    )

    const failDkimInfoPanel = (
      <InfoPanel state={failDkimState}>
        <InfoBox
          title="Source IP Address"
          info="The IP address of sending server."
        />
        <InfoBox
          title="DNS Host"
          info="Host from reverse DNS of source IP address."
        />
        <InfoBox
          title="Envelope From"
          info="Domain from Simple Mail Transfer Protocol (SMTP) banner message."
        />
        <InfoBox
          title="Header From"
          info='The address/domain used in the "From" field.'
        />
        <InfoBox
          title="DKIM Domains"
          info="The domains used for DKIM validation."
        />
        <InfoBox
          title="DKIM Selectors"
          info="Pointer to a DKIM public key record in DNS."
        />
        <InfoBox
          title="DKIM Results"
          info="The results of DKIM verification of the message. Can be pass, fail, neutral, temp-error, or perm-error."
        />
        <InfoBox
          title="DKIM Aligned"
          info="Is DKIM aligned. Can be true or false."
        />
        <InfoBox
          title="Total Messages"
          info="The Total Messages from this sender."
        />
        <InfoBox
          title="Guidance"
          info="Details for a given guidance tag can be found on the wiki, see below."
        />
        <Divider borderColor="gray.500" />
        <Link
          isExternal
          href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags"
        >
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>
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
          infoPanel={failDkimInfoPanel}
          infoState={failDkimState}
          changeInfoState={changeFailDkimState}
        />
      </ErrorBoundary>
    )
  }
  // Display DKIM Failure if found
  else if (tableError) {
    dkimFailureTable = <ErrorFallbackMessage error={tableError} />
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
  if (tableLoading) {
    fullPassTable = (
      <LoadingMessage>
        <Trans>Fully Aligned Table</Trans>
      </LoadingMessage>
    )
  }
  // Full pass query no longer loading, check if data exists
  else if (
    tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables?.fullPass
      ?.edges.length > 0
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
    const fullPassNodes = tableData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.fullPass.edges.map(
      (edge) => {
        return { ...edge.node }
      },
    )

    const fullPassInfoPanel = (
      <InfoPanel state={fullPassState}>
        <InfoBox
          title="Source IP Address"
          info="The IP address of sending server."
        />
        <InfoBox
          title="DNS Host"
          info="Host from reverse DNS of source IP address."
        />
        <InfoBox
          title="Envelope From"
          info="Domain from Simple Mail Transfer Protocol (SMTP) banner message."
        />
        <InfoBox
          title="Header From"
          info='The address/domain used in the "From" field.'
        />
        <InfoBox title="SPF Domains" info="Domains used for SPF validation." />
        <InfoBox
          title="DKIM Domains"
          info="Domains used for DKIM validation."
        />
        <InfoBox
          title="DKIM Selectors"
          info="Pointer to a DKIM public key record in DNS."
        />
        <InfoBox
          title="Total Messages"
          info="The Total Messages from this sender."
        />
      </InfoPanel>
    )

    fullPassTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <DmarcReportTable
          data={fullPassNodes}
          columns={fullPassColumns}
          title={t`Fully Aligned by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
          infoPanel={fullPassInfoPanel}
          infoState={fullPassState}
          changeInfoState={changeFullPassState}
        />
      </ErrorBoundary>
    )
  }
  // Display Fully Aligned Error if found
  else if (tableError) {
    fullPassTable = <ErrorFallbackMessage error={tableError} />
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
  if (tableLoading) {
    spfFailureTable = (
      <LoadingMessage>
        <Trans>SPF Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // SPF Failure query no longer loading, check if data exists
  else if (
    tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
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
    const spfFailureNodes = tableData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.spfFailure.edges.map(
      (edge) => {
        const node = { ...edge.node }
        node.spfAligned = node.spfAligned.toString()
        return node
      },
    )

    const failSpfInfoPanel = (
      <InfoPanel state={failSpfState}>
        <InfoBox
          title="Source IP Address"
          info="The IP address of sending server."
        />
        <InfoBox
          title="DNS Host"
          info="Host from reverse DNS of source IP address."
        />
        <InfoBox
          title="Envelope From"
          info="Domain from Simple Mail Transfer Protocol (SMTP) banner message."
        />
        <InfoBox
          title="Header From"
          info='The address/domain used in the "From" field.'
        />
        <InfoBox title="SPF Domains" info="Domains used for SPF validation." />
        <InfoBox
          title="SPF Results"
          info="The results of DKIM verification of the message. Can be pass, fail, neutral, soft-fail, temp-error, or perm-error."
        />
        <InfoBox
          title="SPF Aligned"
          info="Is SPF aligned. Can be true or false."
        />
        <InfoBox
          title="Total Messages"
          info="The Total Messages from this sender."
        />
        <InfoBox
          title="Guidance"
          info="Details for a given guidance tag can be found on the wiki, see below."
        />
        <Divider borderColor="gray.500" />
        <Link
          isExternal
          href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags"
        >
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>
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
          infoPanel={failSpfInfoPanel}
          infoState={failSpfState}
          changeInfoState={changeFailSpfState}
        />
      </ErrorBoundary>
    )
  }
  // Display SPF Failure if found
  else if (tableError) {
    spfFailureTable = <ErrorFallbackMessage error={tableError} />
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
  if (tableLoading) {
    dmarcFailureTable = (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // DMARC Failure query no longer loading, check if data exists
  else if (
    tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables
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
    const dmarcFailureNodes = tableData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.dmarcFailure.edges.map(
      (edge) => {
        return { ...edge.node }
      },
    )

    const fullFailInfoPanel = (
      <InfoPanel state={fullFailState}>
        <InfoBox title="Source IP Address" info="The domain address." />
        <InfoBox
          title="DNS Host"
          info="Shows the total number of emails that have been sent by this domain during the selected time range."
        />
        <InfoBox
          title="Envelope From"
          info="Shows the percentage of emails from the domain that have passed both SPF and DKIM requirments."
        />
        <InfoBox
          title="Header From"
          info='The address/domain used in the "From" field.'
        />
        <InfoBox title="SPF Domains" info="Domains used for SPF validation." />
        <InfoBox
          title="DKIM Domains"
          info="The domains used for DKIM validation."
        />
        <InfoBox
          title="DKIM Selectors"
          info="Pointer to a DKIM public key record in DNS."
        />
        <InfoBox
          title="Disposition"
          info="The DMARC enforcement action that the receiver took, either none, quarantine, or reject."
        />
        <InfoBox
          title="Total Messages"
          info="The Total Messages from this sender."
        />
      </InfoPanel>
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
          infoPanel={fullFailInfoPanel}
          infoState={fullFailState}
          changeInfoState={changeFullFailState}
        />
      </ErrorBoundary>
    )
  }
  // Display DMARC Failure if found
  else if (tableError) {
    dmarcFailureTable = <ErrorFallbackMessage error={tableError} />
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
      {dkimFailureTable}
      {spfFailureTable}
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
