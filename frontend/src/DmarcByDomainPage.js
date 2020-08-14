import React from 'react'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/client'
import { DMARC_SUMMARIES } from './graphql/queries'
import { Box, Stack, Text } from '@chakra-ui/core'
import DmarcReportTable from './DmarcReportTable'
import { t, Trans } from '@lingui/macro'
import { number } from 'prop-types'
import { useLingui } from '@lingui/react'
import theme from './theme/canada'

export default function DmarcByDomainPage() {
  const { currentUser } = useUserState()
  const { i18n } = useLingui()

  const {
    loading: tableLoading,
    error: tableError,
    data: tableData,
  } = useQuery(DMARC_SUMMARIES, {
    context: {
      headers: {
        authorization: currentUser.jwt,
      },
    },
    variables: {
      orgSlug: 'test-org-slug',
    },
  })

  if (tableLoading) return <p>Loading...</p>
  // TODO: Properly handle these errors
  if (tableError) return <p>Error</p>

  // TODO: remove this after the new api function lands.
  const summaryData = {
    categories: [
      {
        name: 'fullPass',
        count: 33,
        percentage: 33,
      },
      {
        name: 'partialPass',
        count: 33,
        percentage: 33,
      },
      {
        name: 'fail',
        count: 33,
        percentage: 33,
      },
    ],
    total: 100,
  }

  const strengths = {
    strong: {
      types: ['fullPass'],
      name: i18n._(t`Pass`),
    },
    moderate: {
      types: ['partialPass'],
      name: i18n._(t`Partial Pass`),
    },
    weak: {
      types: ['fail'],
      name: i18n._(t`Fail`),
    },
  }

  // const detailTablesData = tableData.demoDmarcReportDetailTables.detailTables
  //
  // const dmarcFailureData = detailTablesData.dmarcFailure

  // Initial sorting category for detail tables
  // const initialSort = [{ id: 'totalMessages', desc: true }]
  //
  // const [
  //   sourceIpAddress,
  //   envelopeFrom,
  //   dkimDomains,
  //   dkimSelectors,
  //   totalMessages,
  //   countryCode,
  //   prefixOrg,
  //   dnsHost,
  //   spfDomains,
  // ] = [
  //   { Header: i18n._(t`Source IP Address`), accessor: 'sourceIpAddress' },
  //   { Header: i18n._(t`Envelope From`), accessor: 'envelopeFrom' },
  //   { Header: i18n._(t`DKIM Domains`), accessor: 'dkimDomains' },
  //   { Header: i18n._(t`DKIM Selectors`), accessor: 'dkimSelectors' },
  //   { Header: i18n._(t`Total Messages`), accessor: 'totalMessages' },
  //   { Header: i18n._(t`Country Code`), accessor: 'countryCode' },
  //   { Header: i18n._(t`Prefix Org`), accessor: 'prefixOrg' },
  //   { Header: i18n._(t`DNS Host`), accessor: 'dnsHost' },
  //   { Header: i18n._(t`SPF Domains`), accessor: 'spfDomains' },
  // ]
  //
  // const dmarcFailureColumns = [
  //   {
  //     Header: i18n._(t`DMARC Failures by IP Address`),
  //     hidden: true,
  //     columns: [
  //       sourceIpAddress,
  //       envelopeFrom,
  //       countryCode,
  //       prefixOrg,
  //       dnsHost,
  //       spfDomains,
  //       dkimDomains,
  //       dkimSelectors,
  //       totalMessages,
  //     ],
  //   },
  // ]

  return (
    <Box width="100%">
      <Text>DMARC Summaries Page</Text>
      {/*<DmarcReportTable*/}
      {/*  data={dmarcFailureData}*/}
      {/*  columns={dmarcFailureColumns}*/}
      {/*  title={i18n._(t`Pass/Fail Ratios by Domain - Last 30 Days`)}*/}
      {/*  initialSort={initialSort}*/}
      {/*  mb="30px"*/}
      {/*/>*/}
    </Box>
  )
}

DmarcByDomainPage.propTypes = {}
