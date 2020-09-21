const { DMARC_REPORT_API_URL = 'http://localhost:4001/graphql' } = process.env

const dmarcReportLoader = ({
  generateGqlQuery,
  generateDetailTableFields,
  fetch,
}) => async ({ info, domain, userId }) => {
  const genGqlQuery = generateGqlQuery({ generateDetailTableFields })
  let data
  try {
    const gqlQuery = genGqlQuery({ info, domain })
    data = await fetch(DMARC_REPORT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery }),
    }).then((response) => response.json())
  } catch (err) {
    console.error(
      `Fetch error occurred well User: ${userId} was trying to retrieve ${info.fieldName} from the dmarc-report-api, error: ${err}`,
    )
    throw new Error(
      `Unable to retrieve ${info.fieldName} for domain: ${domain}.`,
    )
  }

  return data
}

module.exports = {
  dmarcReportLoader,
}
