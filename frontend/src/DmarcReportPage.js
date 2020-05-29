import React from 'react'
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
        authorization: currentUser.jwt,
      },
    },
    variables: { domain: slugify('cyber.gc.ca') },
  })

  const [show, setShow] = React.useState(true)
  const handleClick = () => {
    setShow(!show)
    console.log('Show: ' + show)
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>{String(error)}</p>

  const categoryTotals = data.getYearlyReport[0].category_totals

  const strong = (({ spf_pass_dkim_pass }) => ({
    spf_pass_dkim_pass,
  }))(categoryTotals)

  const moderate = (({ spf_fail_dkim_pass, spf_pass_dkim_fail }) => ({
    spf_fail_dkim_pass,
    spf_pass_dkim_fail,
  }))(categoryTotals)

  const weak = (({
    dmarc_fail_reject,
    dmarc_fail_none,
    dmarc_fail_quarantine,
  }) => ({
    dmarc_fail_reject,
    dmarc_fail_none,
    dmarc_fail_quarantine,
  }))(categoryTotals)

  const unknown = (({ unknown }) => ({
    unknown,
  }))(categoryTotals)

  const getNameQtyPair = (categoryPair) => {
    return Object.keys(categoryPair).map((key) => {
      return { name: key, qty: categoryPair[key] }
    })
  }

  const cardData = [
    {
      strength: 'strong',
      name: 'Pass',
      categories: getNameQtyPair(strong),
    },
    {
      strength: 'moderate',
      name: 'Partial pass',
      categories: getNameQtyPair(moderate),
    },
    {
      strength: 'weak',
      name: 'All fail',
      categories: getNameQtyPair(weak),
    },
    {
      strength: 'unknown',
      name: 'Unknown',
      categories: getNameQtyPair(unknown),
    },
  ]

  return (
    <SummaryCard
      title="DMARC Report"
      description="Description of DMARC report"
      data={cardData}
      slider={false}
    />
  )
}
