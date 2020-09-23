const GET_FILE_CONTENTS = `
{
  repository(name: "reading-json-file-demo", owner: "nslandolt") {
    id
    object(expression: "master:file.json") {
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