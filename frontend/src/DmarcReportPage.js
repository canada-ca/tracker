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
import { number } from 'prop-types'
import { useLingui } from '@lingui/react'
import { useParams, useHistory } from 'react-router-dom'
import { months } from './months'

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()
  const { domainSlug, period, year } = useParams()
  const history = useHistory()

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
      variables: { domainSlug: domainSlug },
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
      {i18n._(t`Last 30 Days`)}
    </option>,
  ]

  // add dmarc date selection options
  for (let i = currentDate.getMonth(), j = 13; j > 0; i--, j--) {
    // handle previous year
    if (i < 0) {
      const value = `${months[months.length + i].toUpperCase()}, ${
        currentDate.getFullYear() - 1
      }`
      const translatedValue = `${i18n
        ._(months[months.length + i])
        .toUpperCase()}, ${currentDate.getFullYear() - 1}`

      options.push(
        <option key={value} value={value}>
          {translatedValue}
        </option>,
      )
    }
    // handle current year
    else {
      const value = `${months[i].toUpperCase()}, ${currentDate.getFullYear()}`
      const translatedValue = `${i18n
        ._(months[i])
        .toUpperCase()}, ${currentDate.getFullYear()}`

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
          displayName: i18n._(t`Pass`),
        },
      ],
      moderate: [
        {
          name: 'passSpfOnly',
          displayName: i18n._(t`Pass Only SPF`),
        },
      ],
      moderateAlt: [
        {
          name: 'passDkimOnly',
          displayName: i18n._(t`Pass Only DKIM`),
        },
      ],
      weak: [
        {
          name: 'fail',
          displayName: i18n._(t`Fail`),
        },
      ],
    }

    const formattedBarData = {
      periods: barData.dmarcReportSummaryList.map((entry) => {
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
  if (
    !tableError &&
    !tableLoading &&
    tableData.dmarcReportDetailTables.detailTables.fullPass.length > 0
  ) {
    const detailTablesData = tableData.dmarcReportDetailTables.detailTables

    const fullPassData = detailTablesData.fullPass
    const spfFailureData = detailTablesData.spfFailure
    const spfMisalignedData = detailTablesData.spfMisaligned
    const dkimFailureData = detailTablesData.dkimFailure
    const dkimMisalignedData = detailTablesData.dkimMisaligned
    const dmarcFailureData = detailTablesData.dmarcFailure

    // Initial sorting category for detail tables
    const initialSort = [{ id: 'totalMessages', desc: true }]

    const [
      sourceIpAddress,
      envelopeFrom,
      dkimDomains,
      dkimSelectors,
      totalMessages,
      countryCode,
      prefixOrg,
      dnsHost,
      spfDomains,
    ] = [
      { Header: i18n._(t`Source IP Address`), accessor: 'sourceIpAddress' },
      { Header: i18n._(t`Envelope From`), accessor: 'envelopeFrom' },
      { Header: i18n._(t`DKIM Domains`), accessor: 'dkimDomains' },
      { Header: i18n._(t`DKIM Selectors`), accessor: 'dkimSelectors' },
      { Header: i18n._(t`Total Messages`), accessor: 'totalMessages' },
      { Header: i18n._(t`Country Code`), accessor: 'countryCode' },
      { Header: i18n._(t`Prefix Org`), accessor: 'prefixOrg' },
      { Header: i18n._(t`DNS Host`), accessor: 'dnsHost' },
      { Header: i18n._(t`SPF Domains`), accessor: 'spfDomains' },
    ]

    const fullPassColumns = [
      {
        Header: i18n._(t`Fully Aligned by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          spfDomains,
          dkimDomains,
          dkimSelectors,
          totalMessages,
        ],
      },
    ]

    const spfFailureColumns = [
      {
        Header: i18n._(t`SPF Failures by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          spfDomains,
          totalMessages,
        ],
      },
    ]

    const spfMisalignedColumns = [
      {
        Header: i18n._(t`SPF Misalignment by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          spfDomains,
          totalMessages,
        ],
      },
    ]

    const dkimFailureColumns = [
      {
        Header: i18n._(t`DKIM Failures by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          dkimDomains,
          dkimSelectors,
          totalMessages,
        ],
      },
    ]

    const dkimMisalignedColumns = [
      {
        Header: i18n._(t`DKIM Misalignment by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          dkimDomains,
          dkimSelectors,
          totalMessages,
        ],
      },
    ]

    const dmarcFailureColumns = [
      {
        Header: i18n._(t`DMARC Failures by IP Address`),
        hidden: true,
        columns: [
          sourceIpAddress,
          envelopeFrom,
          countryCode,
          prefixOrg,
          dnsHost,
          spfDomains,
          dkimDomains,
          dkimSelectors,
          totalMessages,
        ],
      },
    ]
    tableDisplay = (
      <>
        <DmarcReportTable
          data={fullPassData}
          columns={fullPassColumns}
          title={i18n._(t`Fully Aligned by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
        <DmarcReportTable
          data={spfFailureData}
          columns={spfFailureColumns}
          title={i18n._(t`SPF Failures by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
        <DmarcReportTable
          data={spfMisalignedData}
          columns={spfMisalignedColumns}
          title={i18n._(t`SPF Misalignment by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
        <DmarcReportTable
          data={dkimFailureData}
          columns={dkimFailureColumns}
          title={i18n._(t`DKIM Failures by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
        <DmarcReportTable
          data={dkimMisalignedData}
          columns={dkimMisalignedColumns}
          title={i18n._(t`DKIM Misalignment by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
        <DmarcReportTable
          data={dmarcFailureData}
          columns={dmarcFailureColumns}
          title={i18n._(t`DMARC Failures by IP Address`)}
          initialSort={initialSort}
          mb="8"
        />
      </>
    )
  }
  // handle errors / loading / no data
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
