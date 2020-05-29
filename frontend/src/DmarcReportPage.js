import React from 'react'
import { Trans } from '@lingui/macro'
import {
  Text,
  Stack,
  SimpleGrid,
  Box,
  Button,
  Heading,
  Icon,
  Flex,
  Divider,
} from '@chakra-ui/core'
import { useUserState } from './UserState'
import { useQuery } from '@apollo/react-hooks'
import { GET_YEARLY_REPORT } from './graphql/queries'
import { slugify } from './slugify'
import { SummaryCard } from './SummaryCard'

export function DmarcReportPage() {
  const { currentUser } = useUserState()
  const { loading, error, data } = useQuery(GET_YEARLY_REPORT, {
    context: {
      headers: {
        // authorization: currentUser.jwt,
      },
    },
    variables: { domain: slugify('cyber.gc.ca') },
  })

  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }

  console.log(data)

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  const cardData = [
    {
      strength: 'strong',
      name: 'Pass',
      categories: [
        {
          name: 'spf_pass_dkim_pass',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
      ],
    },
    {
      strength: 'moderate',
      name: 'Partial pass',
      categories: [
        {
          name: 'spf_fail_dkim_pass',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
        {
          name: 'spf_pass_dkim_fail',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
      ],
    },
    {
      strength: 'weak',
      name: 'All fail',
      categories: [
        {
          name: 'dmarc_fail_reject',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
        { name: 'dmarc_fail_none', qty: Math.floor(Math.random() * 1000 + 1) },
        {
          name: 'dmarc_fail_quarantine',
          qty: Math.floor(Math.random() * 1000 + 1),
        },
      ],
    },
    {
      strength: 'unknown',
      name: 'Unknown',
      categories: [
        { name: 'unknown', qty: Math.floor(Math.random() * 1000 + 1) },
      ],
    },
  ]

  return (
    <SummaryCard
      title="DMARC Report"
      description="Description of DMARC report"
      data={cardData}
    />
  )
}
