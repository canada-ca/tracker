import React, { useState } from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import {
  DMARC_REPORT_DETAIL_TABLES,
  DMARC_REPORT_SUMMARY_LIST,
} from './graphql/queries'
import DmarcTimeGraph from './DmarcReportSummaryGraph'
import { Box, Heading, IconButton, Select, Stack, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { number } from 'prop-types'
import { useParams, useHistory } from 'react-router-dom'
import { months } from './months'

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { domainSlug, period, year } = useParams()
  const history = useHistory()
  const { i18n } = useLingui()

  const currentDate = new Date()
  const [selectedPeriod, setSelectedPeriod] = useState(period || 'LAST30DAYS')
  const [selectedYear, setSelectedYear] = useState(
    year || currentDate.getFullYear().toString(),
  )
  const [selectedDate, setSelectedDate] = useState(
    `${selectedPeriod}, ${selectedYear}`,
  )

  const { loading: barLoading, error: barError, data: barData } = useQuery(
    DMARC_REPORT_SUMMARY_LIST,
    {
      context: {
        headers: {
          authorization: currentUser.jwt,
        },
      },
      variables: { domain: domainSlug },
    },
  )

  const {
    loading: tableLoading,
    error: tableError,
    data: tableData,
  } = useQuery(DMARC_REPORT_DETAIL_TABLES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      domainSlug: domainSlug,
      period: selectedPeriod,
      year: selectedYear,
    },
  })

  if (tableLoading && barLoading)
    return (
      <Text>
        <Trans>Loading...</Trans>
      </Text>
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
    history.push(`/domains/${domainSlug}/dmarc-report/${newPeriod}/${newYear}`)
  }

  // Create dmarc bar graph if not loading and no errors
  let barDisplay
  if (!barLoading && !barError) {
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

    const formattedBarData = {
      periods: barData.findDomainByDomain.yearlyDmarcSummaries.map((entry) => {
        return { month: entry.month, year: entry.year, ...entry.categoryTotals }
      }),
    }
    formattedBarData.strengths = strengths

    barDisplay = (
      <DmarcTimeGraph
        data={formattedBarData}
        width="100%"
        mr="400px"
        responsiveWidth={summaryListResponsiveWidth}
      />
    )
  } else {
    // handle errors / loading
    barDisplay = (
      <Heading as="h3" size="lg" textAlign="center">
        {barLoading ? (
          <Trans>Loading...</Trans>
        ) : barError ? (
          <Trans>Error while querying for summary bar graph</Trans>
        ) : (
          ''
        )}
      </Heading>
    )
  }

  // Create report tables if no errors and message data exist
  let tableDisplay
  if (!tableError && !tableLoading) {
    const detailTablesData = tableData.dmarcReportDetailTables.detailTables

    const fullPassData = detailTablesData.fullPass
    const spfFailureData = detailTablesData.spfFailure
    // const spfMisalignedData = detailTablesData.spfMisaligned
    const dkimFailureData = detailTablesData.dkimFailure
    // const dkimMisalignedData = detailTablesData.dkimMisaligned
    const dmarcFailureData = detailTablesData.dmarcFailure

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

    // const spfMisalignedColumns = [
    //   {
    //     Header: i18n._(t`SPF Misalignment by IP Address`),
    //     hidden: true,
    //     columns: [
    //       sourceIpAddress,
    //       envelopeFrom,
    //       countryCode,
    //       prefixOrg,
    //       dnsHost,
    //       spfDomains,
    //       totalMessages,
    //     ],
    //   },
    // ]

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

    // const dkimMisalignedColumns = [
    //   {
    //     Header: i18n._(t`DKIM Misalignment by IP Address`),
    //     hidden: true,
    //     columns: [
    //       sourceIpAddress,
    //       envelopeFrom,
    //       countryCode,
    //       prefixOrg,
    //       dnsHost,
    //       dkimDomains,
    //       dkimSelectors,
    //       totalMessages,
    //     ],
    //   },
    // ]

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
  // handle errors / loading
  else
    tableDisplay = (
      <Heading as="h3" size="lg" textAlign="center">
        {tableLoading ? (
          <Trans>Loading...</Trans>
        ) : tableError ? (
          <Trans>Error while querying for summary tables</Trans>
        ) : (
          ''
        )}
      </Heading>
    )

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

      {barDisplay}

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
