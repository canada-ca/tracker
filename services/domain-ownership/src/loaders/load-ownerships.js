const fetch = require('isomorphic-fetch')

const { GITHUB_TOKEN, GITHUB_URL } = process.env

const { GET_FILE_CONTENTS } = require('../graphql')

const loadDomainOwnership = async () => {
  let repoInfo

  try {
    repoInfo = await fetch(GITHUB_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `bearer ${GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query: GET_FILE_CONTENTS }),
    }).then((response) => response.json())
  } catch (err) {
    throw new Error(
      `Error occurred while fetching domain ownership information: ${err}`,
    )
  }

  const domainOwnership = JSON.parse(repoInfo.data.repository.object.text)

  return domainOwnership
}

module.exports = {
  loadDomainOwnership,
}
