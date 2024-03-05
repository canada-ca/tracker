const { Octokit } = require('octokit')

const { GITHUB_TOKEN, GITHUB_BRANCH, GITHUB_FILE, GITHUB_OWNER, GITHUB_REPO } = process.env

async function loadDomainOwnership() {
  try {
    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    })

    const resp = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: GITHUB_OWNER,
      repo: GITHUB_REPO,
      path: GITHUB_FILE,
      ref: GITHUB_BRANCH,
    })

    const data = resp.data
    const decodedContent = Buffer.from(data.content, 'base64').toString('utf-8')
    return JSON.parse(decodedContent)
  } catch (err) {
    console.error(`Error loading domain ownership: ${err}`)
    throw err
  }
}

module.exports = {
  loadDomainOwnership,
}
