import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import {
  Accordion,
  AlertDescription,
  AlertTitle,
  Box,
  Divider,
  Flex,
  Heading,
  Link,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import { LinkIcon } from '@chakra-ui/icons'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number } from 'prop-types'
import { Link as RouteLink, useNavigate, useParams } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'

import { DmarcReportSummaryGraph } from './DmarcReportSummaryGraph'

import { TrackerTable } from '../components/TrackerTable'
import { InfoBox, InfoPanel } from '../components/InfoPanel'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TrackerAccordionItem as AccordionItem } from '../components/TrackerAccordionItem'
import { useDocumentTitle } from '../utilities/useDocumentTitle'
import { DMARC_REPORT_GRAPH, PAGINATED_DMARC_REPORT } from '../graphql/queries'
import { MonthSelect } from '../components/MonthSelect'
import { NotificationBanner } from '../app/NotificationBanner'

export default function DmarcReportPage() {
  const { domainSlug, period, year } = useParams()
  const fileName = `${domainSlug}_${period}-${year}`
  const navigate = useNavigate()
  const { i18n } = useLingui()

  useDocumentTitle(t`DMARC Report for ${domainSlug}`)

  const [selectedPeriod, setSelectedPeriod] = useState(period)
  const [selectedYear, setSelectedYear] = useState(year)
  const [selectedDate, setSelectedDate] = useState(`${selectedPeriod}, ${selectedYear}`)

  const { isOpen: fullPassOpen, onToggle: fullPassToggle } = useDisclosure()
  const { isOpen: failDkimOpen, onToggle: failDkimToggle } = useDisclosure()
  const { isOpen: failSpfOpen, onToggle: failSpfToggle } = useDisclosure()
  const { isOpen: failDmarcOpen, onToggle: failDmarcToggle } = useDisclosure()

  // Allows the use of forward/backward navigation
  if (selectedPeriod !== period) setSelectedPeriod(period)
  if (selectedYear !== year) setSelectedPeriod(year)
  if (selectedDate !== `${period}, ${year}`) setSelectedDate(`${period}, ${year}`)

  const {
    loading: graphLoading,
    error: graphError,
    data: graphData,
  } = useQuery(DMARC_REPORT_GRAPH, {
    variables: {
      domain: domainSlug,
    },
    errorPolicy: 'ignore', // allow partial success
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

  // Show data for newly selected date
  const handleChange = (e) => {
    setSelectedDate(e.target.value)
    const [newPeriod, newYear] = e.target.value.split(', ')
    setSelectedPeriod(newPeriod)
    setSelectedYear(newYear)
    navigate(`/domains/${domainSlug}/dmarc-report/${newPeriod}/${newYear}`, { replace: true })
  }

  // Set DMARC bar graph Loading
  if (graphLoading || tableLoading) {
    return (
      <LoadingMessage>
        <Trans>DMARC Report</Trans>
      </LoadingMessage>
    )
  }

  if (tableError || graphError) {
    return (
      <Box align="center" w="100%" px={4}>
        <Text textAlign="center" fontSize="2xl" fontWeight="bold">
          <Trans>
            Error while retrieving DMARC data for {domainSlug}. <br />
            This could be due to insufficient user privileges or the domain does not exist in the system.
          </Trans>
        </Text>
      </Box>
    )
  }

  if (graphData?.findDomainByDomain?.hasDMARCReport === false) {
    return (
      <Box align="center" w="100%" px={4}>
        <Text textAlign="center" fontSize="3xl" fontWeight="bold">
          <Trans>{domainSlug} does not support aggregate data</Trans>
        </Text>
      </Box>
    )
  }

  // DMARC bar graph setup
  let graphDisplay

  // Display graph query error if found
  if (graphError) {
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
      periods: graphData.findDomainByDomain.yearlyDmarcSummaries.map((entry) => {
        return {
          month: entry.month,
          year: entry.year,
          ...entry.categoryTotals,
          ...entry.categoryPercentages,
        }
      }),
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
    Header: t`Source IP Address`,
    accessor: 'sourceIpAddress',
    style: { whiteSpace: 'nowrap' },
  }
  const envelopeFrom = {
    Header: t`Envelope From`,
    accessor: 'envelopeFrom',
    style: { whiteSpace: 'nowrap' },
  }
  const dkimDomains = {
    Header: t`DKIM Domains`,
    accessor: 'dkimDomains',
  }
  const dkimSelectors = {
    Header: t`DKIM Selectors`,
    accessor: 'dkimSelectors',
  }
  const totalMessages = {
    Header: t`Total Messages`,
    accessor: 'totalMessages',
    Cell: ({ value }) => value.toLocaleString(i18n.locale),
    style: { textAlign: 'right' },
  }
  const dnsHost = { Header: t`DNS Host`, accessor: 'dnsHost' }
  const spfDomains = {
    Header: t`SPF Domains`,
    accessor: 'spfDomains',
  }
  const headerFrom = {
    Header: t`Header From`,
    accessor: 'headerFrom',
    style: { whiteSpace: 'nowrap' },
  }
  const guidance = {
    Header: t`Guidance`,
    accessor: 'guidanceTag',
  }
  const spfAligned = {
    Header: t`SPF Aligned`,
    accessor: 'spfAligned',
  }
  const spfResults = {
    Header: t`SPF Results`,
    accessor: 'spfResults',
  }
  const dkimAligned = {
    Header: t`DKIM Aligned`,
    accessor: 'dkimAligned',
  }
  const dkimResults = {
    Header: t`DKIM Results`,
    accessor: 'dkimResults',
  }
  const disposition = {
    Header: t`Disposition`,
    accessor: 'disposition',
  }

  const glossary = {
    sourceIpAddress: {
      title: sourceIpAddress.Header,
      info: t`The IP address of sending server.`,
    },
    envelopeFrom: {
      title: envelopeFrom.Header,
      info: t`Domain from Simple Mail Transfer Protocol (SMTP) banner message.`,
    },
    dkimDomains: {
      title: dkimDomains.Header,
      info: t`The domains used for DKIM validation.`,
    },
    dkimSelectors: {
      title: dkimSelectors.Header,
      info: t`Pointer to a DKIM public key record in DNS.`,
    },
    totalMessages: {
      title: totalMessages.Header,
      info: t`The Total Messages from this sender.`,
    },
    dnsHost: {
      title: dnsHost.Header,
      info: t`Host from reverse DNS of source IP address.`,
    },
    spfDomains: {
      title: spfDomains.Header,
      info: t`Domains used for SPF validation.`,
    },
    headerFrom: {
      title: headerFrom.Header,
      info: t`The address/domain used in the "From" field.`,
    },
    guidance: {
      title: guidance.Header,
      info: t`Details for a given guidance tag can be found on the wiki, see below.`,
    },
    spfAligned: {
      title: spfAligned.Header,
      info: t`Is SPF aligned. Can be true or false.`,
    },
    spfResults: {
      title: spfResults.Header,
      info: t`The results of DKIM verification of the message. Can be pass, fail, neutral, soft-fail, temp-error, or perm-error.`,
    },
    dkimAligned: {
      title: dkimAligned.Header,
      info: t`Is DKIM aligned. Can be true or false.`,
    },
    dkimResults: {
      title: dkimResults.Header,
      info: t`The results of DKIM verification of the message. Can be pass, fail, neutral, temp-error, or perm-error.`,
    },
    disposition: {
      title: disposition.Header,
      info: t`The DMARC enforcement action that the receiver took, either none, quarantine, or reject.`,
    },
  }

  const generalGlossary = (
    <>
      <InfoBox title={glossary.sourceIpAddress.title} info={glossary.sourceIpAddress.info} />
      <InfoBox title={glossary.dnsHost.title} info={glossary.dnsHost.info} />
      <InfoBox title={glossary.envelopeFrom.title} info={glossary.envelopeFrom.info} />
      <InfoBox title={glossary.headerFrom.title} info={glossary.headerFrom.info} />
    </>
  )

  const dataToCsv = (columns, data) => {
    let csvOutput = columns.map((column) => column.Header).join(',')
    data.forEach((entry) => {
      const csvLine = columns
        .map((column) => {
          let cell = entry[column.accessor]
          if (column.accessor === 'guidanceTag') {
            cell = entry[column.accessor].guidance
          }
          return `"${cell}"`
        })
        .join(',')
      csvOutput += `\n${csvLine}`
    })

    return csvOutput
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
  else if (tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables?.dkimFailure?.edges.length > 0) {
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
        node.dkimDomains = node.dkimDomains.replace(/,/g, ', ')
        node.dkimSelectors = node.dkimSelectors.replace(/,/g, ', ')
        node.dkimResults = node.dkimResults.replace(/,/g, ', ')
        return node
      },
    )

    dkimFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <TrackerTable
          data={dkimFailureNodes}
          columns={dkimFailureColumns}
          title={t`DKIM Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
          searchPlaceholder={t`Search DKIM Failing Items`}
          fileName={fileName}
          exportDataFunction={() => dataToCsv(dkimFailureColumns[0].columns, dkimFailureNodes)}
          onToggle={failDkimToggle}
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
  else if (tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables?.fullPass?.edges.length > 0) {
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
    const fullPassNodes = tableData.findDomainByDomain.dmarcSummaryByPeriod.detailTables.fullPass.edges.map((edge) => {
      const node = { ...edge.node }
      node.spfDomains = node.spfDomains.replace(/,/g, ', ')
      node.dkimDomains = node.dkimDomains.replace(/,/g, ', ')
      node.dkimSelectors = node.dkimSelectors.replace(/,/g, ', ')
      return node
    })

    fullPassTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <TrackerTable
          data={fullPassNodes}
          columns={fullPassColumns}
          title={t`Fully Aligned by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
          searchPlaceholder={t`Search Fully Aligned Items`}
          fileName={fileName}
          exportDataFunction={() => dataToCsv(fullPassColumns[0].columns, fullPassNodes)}
          onToggle={fullPassToggle}
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
  else if (tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables?.spfFailure?.edges.length > 0) {
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
        node.spfDomains = node.spfDomains.replace(/,/g, ', ')
        return node
      },
    )

    spfFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <TrackerTable
          data={spfFailureNodes}
          columns={spfFailureColumns}
          title={t`SPF Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
          searchPlaceholder={t`Search SPF Failing Items`}
          fileName={fileName}
          exportDataFunction={() => dataToCsv(spfFailureColumns[0].columns, spfFailureNodes)}
          onToggle={failSpfToggle}
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
  const dmarcFailStats = {
    none: 0,
    reject: 0,
    quarantine: 0,
  }

  // Set DMARC Failure Table Loading
  if (tableLoading) {
    dmarcFailureTable = (
      <LoadingMessage>
        <Trans>DMARC Failure Table</Trans>
      </LoadingMessage>
    )
  }
  // DMARC Failure query no longer loading, check if data exists
  else if (tableData?.findDomainByDomain?.dmarcSummaryByPeriod?.detailTables?.dmarcFailure?.edges.length > 0) {
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
        const node = { ...edge.node }

        // calculate dmarcFailStats totals
        dmarcFailStats[node.disposition] += node.totalMessages

        node.spfDomains = node.spfDomains.replace(/,/g, ', ')
        node.dkimDomains = node.dkimDomains.replace(/,/g, ', ')
        node.dkimSelectors = node.dkimSelectors.replace(/,/g, ', ')
        return node
      },
    )

    dmarcFailureTable = (
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <TrackerTable
          data={dmarcFailureNodes}
          columns={dmarcFailureColumns}
          title={t`DMARC Failures by IP Address`}
          initialSort={initialSort}
          frontendPagination={true}
          searchPlaceholder={t`Search DMARC Failing Items`}
          fileName={fileName}
          exportDataFunction={() => dataToCsv(dmarcFailureColumns[0].columns, dmarcFailureNodes)}
          onToggle={failDmarcToggle}
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

  const fakeEmailDomainBlocks = dmarcFailStats.reject + dmarcFailStats.quarantine
  const domainSpoofingVolume = fakeEmailDomainBlocks + dmarcFailStats.none

  const tableDisplay = (
    <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
      <NotificationBanner status="info" my="4" hideable bannerId="dmarc-table-changes">
        <Box>
          <AlertTitle>
            <Trans>The following data may have recently changed.</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>
              We've made enhancements to our DMARC data tables to provide a more accurate view of the information.
            </Trans>
          </AlertDescription>
        </Box>
      </NotificationBanner>
      <Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
        <AccordionItem buttonLabel={t`Fully Aligned by IP Address`}>{fullPassTable}</AccordionItem>
        <AccordionItem buttonLabel={t`DKIM Failures by IP Address`}>{dkimFailureTable}</AccordionItem>
        <AccordionItem buttonLabel={t`SPF Failures by IP Address`}>{spfFailureTable}</AccordionItem>
        <AccordionItem buttonLabel={t`DMARC Failures by IP Address`}>
          {dmarcFailureTable}
          <Box py="2">
            <Flex>
              <Text fontWeight="bold" mr="1">
                <Trans>Fake email domain blocks (reject + quarantine):</Trans>
              </Text>
              <Text>{fakeEmailDomainBlocks}</Text>
            </Flex>
            <Flex>
              <Text fontWeight="bold" mr="1">
                <Trans>Volume of messages spoofing domain (reject + quarantine + none):</Trans>
              </Text>
              <Text>{domainSpoofingVolume}</Text>
            </Flex>
          </Box>
        </AccordionItem>
      </Accordion>
    </ErrorBoundary>
  )

  return (
    <Box width="100%" px="2" mx="auto" overflow="hidden" pb="4">
      <Box display={{ md: 'grid' }} gridTemplateColumns={{ md: '1fr 1fr 1fr' }}>
        <Box />
        <Heading as="h1" textAlign="center" mb="4">
          {domainSlug.toUpperCase()}
        </Heading>
        <Flex>
          <Link ml="auto" my="auto" color="teal.600" whiteSpace="noWrap" to={`/domains/${domainSlug}`} as={RouteLink}>
            <Trans>Guidance</Trans>
            <LinkIcon ml="4px" aria-hidden="true" />
          </Link>
        </Flex>
      </Box>

      <NotificationBanner status="warning" bannerId="dmarc-report-outage" hideable>
        <Box>
          <AlertTitle>
            <Trans>Note:</Trans>
          </AlertTitle>
          <AlertDescription>
            <Trans>
              There is a gap in historical DMARC data between December 20, 2024 and January 21, 2025 due to a service
              disruption. This does not affect current DMARC reporting, and all data before and after this period
              remains complete and accurate.
            </Trans>
          </AlertDescription>
        </Box>
      </NotificationBanner>

      {graphDisplay}

      <Flex align="center" mb={2}>
        <Text as="label" htmlFor="data-date-range" fontWeight="bold" textAlign="center" mr={1}>
          <Trans>Showing data for period: </Trans>
        </Text>
        <MonthSelect
          id="data-date-range"
          width="fit-content"
          handleChange={handleChange}
          selectedValue={selectedDate}
        />
      </Flex>

      {tableDisplay}

      <InfoPanel isOpen={fullPassOpen} onToggle={fullPassToggle}>
        {generalGlossary}
        <InfoBox title={glossary.spfDomains.title} info={glossary.spfDomains.info} />
        <InfoBox title={glossary.dkimDomains.title} info={glossary.dkimDomains.info} />
        <InfoBox title={glossary.dkimSelectors.title} info={glossary.dkimSelectors.info} />
        <InfoBox title={glossary.totalMessages.title} info={glossary.totalMessages.info} />
        <Divider borderColor="gray.500" />
        <Link isExternal href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags">
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>

      <InfoPanel isOpen={failDkimOpen} onToggle={failDkimToggle}>
        {generalGlossary}
        <InfoBox title={glossary.dkimDomains.title} info={glossary.dkimDomains.info} />
        <InfoBox title={glossary.dkimSelectors.title} info={glossary.dkimSelectors.info} />
        <InfoBox title={glossary.dkimResults.title} info={glossary.dkimResults.info} />
        <InfoBox title={glossary.dkimAligned.title} info={glossary.dkimAligned.info} />
        <InfoBox title={glossary.totalMessages.title} info={glossary.totalMessages.info} />
        <InfoBox title={glossary.guidance.title} info={glossary.guidance.info} />
        <Divider borderColor="gray.500" />
        <Link isExternal href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags">
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>

      <InfoPanel isOpen={failSpfOpen} onToggle={failSpfToggle}>
        {generalGlossary}
        <InfoBox title={glossary.spfDomains.title} info={glossary.spfDomains.info} />
        <InfoBox title={glossary.spfResults.title} info={glossary.spfResults.info} />
        <InfoBox title={glossary.spfAligned.title} info={glossary.spfAligned.info} />
        <InfoBox title={glossary.totalMessages.title} info={glossary.totalMessages.info} />
        <InfoBox title={glossary.guidance.title} info={glossary.guidance.info} />
        <Divider borderColor="gray.500" />
        <Link isExternal href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags">
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>

      <InfoPanel isOpen={failDmarcOpen} onToggle={failDmarcToggle}>
        {generalGlossary}
        <InfoBox title={glossary.spfDomains.title} info={glossary.spfDomains.info} />
        <InfoBox title={glossary.dkimDomains.title} info={glossary.dkimDomains.info} />
        <InfoBox title={glossary.dkimSelectors.title} info={glossary.dkimSelectors.info} />
        <InfoBox title={glossary.disposition.title} info={glossary.disposition.info} />
        <InfoBox title={glossary.totalMessages.title} info={glossary.totalMessages.info} />
        <Divider borderColor="gray.500" />
        <Link isExternal href="https://github.com/canada-ca/tracker/wiki/Guidance-Tags">
          https://github.com/canada-ca/tracker/wiki/Guidance-Tags
        </Link>
      </InfoPanel>
    </Box>
  )
}

DmarcReportPage.propTypes = {
  // Need to allow summaryList ResponsiveContainer width as a set number for tests to work
  summaryListResponsiveWidth: number,
}
