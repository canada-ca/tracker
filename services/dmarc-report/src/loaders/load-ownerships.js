const { GITHUB_TOKEN, GITHUB_URL } = process.env

const { GET_FILE_CONTENTS } = require('../graphql')

const loadDomainOwnership =
  ({ fetch }) =>
  async () => {
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

      const domainOwnership = JSON.parse(repoInfo.data.repository.object.text)

      return domainOwnership
    } catch (err) {
      console.error(
        `Error occurred while fetching domain ownership information: ${err}`,
      )
    }
  }

module.exports = {
  loadDomainOwnership,
}
