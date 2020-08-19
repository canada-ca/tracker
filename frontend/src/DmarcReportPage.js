import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import {
  DMARC_REPORT_DETAIL_TABLES,
  DMARC_REPORT_SUMMARY_LIST,
  DMARC_REPORT_SUMMARY,
} from './graphql/queries'
import SummaryCard from './SummaryCard'
import DmarcTimeGraph from './DmarcReportSummaryGraph'
import {Box, Heading, Stack, Text} from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { number } from 'prop-types'
import { useLingui } from '@lingui/react'
import theme from './theme/canada'
import { useParams } from 'react-router-dom'

const { colors } = theme

export default function DmarcReportPage({ summaryListResponsiveWidth }) {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()
  const { domainSlug } = useParams()

  const {
    loading: summaryLoading,
    error: summaryError,
    data: summaryData,
  } = useQuery(DMARC_REPORT_SUMMARY, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: { domainSlug: domainSlug, period: 'LAST30DAYS', year: '2020' },
  })

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
      period: 'LAST30DAYS',
      year: '2020',
    },
  })

  if (tableLoading || barLoading || summaryLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError || barError || summaryError) return <p>Error</p>

  const total = summaryData.dmarcReportSummary.categoryTotals.total

  const summaryDataTotals = summaryData.dmarcReportSummary.categoryTotals

  const allowedCategories = ['fullPass', 'passSpfOnly', 'passDkimOnly', 'fail']

  const formattedSummaryData = {
    categories: allowedCategories.map((category) => {
      return {
        name: category,
        count: summaryDataTotals[category],
        percentage: Math.round((10 * total) / summaryDataTotals[category]) / 10,
      }
    }),
  }
  formattedSummaryData.total = total

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

  const cardWidth = window.matchMedia('(max-width: 500px)').matches
    ? '100%'
    : window.matchMedia('(max-width: 800px)').matches
    ? '50%'
    : window.matchMedia('(max-width: 1200px)').matches
    ? '35%'
    : '20%'

  const graphWidth =
    cardWidth.slice(0, -1) <= 20
      ? `${100 - Number(cardWidth.slice(0, -1))}%`
      : '100%'

  const cardAndGraphInline = graphWidth !== '100%'

  return (
    <Box width="100%">
      <Heading as="h1" textAlign="center">
        {domainSlug.toUpperCase()}
      </Heading>
      <Stack align="center" isInline={cardAndGraphInline}>
        <SummaryCard
          title={i18n._(t`DMARC Report`)}
          description={i18n._(t`Description of DMARC report`)}
          categoryDisplay={{
            fullPass: {
              name: i18n._(t`Pass`),
              color: colors.strong,
            },
            passSpfOnly: {
              name: i18n._(t`Pass SPF Only`),
              color: colors.moderate,
            },
            passDkimOnly: {
              name: i18n._(t`Pass DKIM Only`),
              color: colors.moderate,
            },
            fail: {
              name: i18n._(t`Fail`),
              color: colors.weak,
            },
          }}
          data={formattedSummaryData}
          width={cardWidth}
          mx="auto"
        />
        <DmarcTimeGraph
          data={formattedBarData}
          width={graphWidth}
          mx="auto"
          responsiveWidth={summaryListResponsiveWidth}
        />
      </Stack>
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
    </Box>
  )
}

DmarcReportPage.propTypes = {
  // Need to allow summaryList ResponsiveContainer width as a set number for tests to work
  summaryListResponsiveWidth: number,
}
