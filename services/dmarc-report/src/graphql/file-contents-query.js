const { GITHUB_BRANCH, GITHUB_FILE, GITHUB_OWNER, GITHUB_REPO } = process.env

const GET_FILE_CONTENTS = `
{
  repository(name: "${GITHUB_REPO}", owner: "${GITHUB_OWNER}") {
    id
    object(expression: "${GITHUB_BRANCH}:${GITHUB_FILE}") {
      ... on Blob {
        text
      }
    }
  }
}
`

module.exports = {
  GET_FILE_CONTENTS,
}
