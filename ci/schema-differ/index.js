const {
  printSchema,
  findBreakingChanges,
  findDangerousChanges,
  DangerousChange,
  BreakingChange,
} = require('graphql')
const { lexicographicSortSchema } = require('graphql/utilities')
const { loadSchema } = require('@graphql-toolkit/core')
const { UrlLoader } = require('@graphql-toolkit/url-loader')
const { JsonFileLoader } = require('@graphql-toolkit/json-file-loader')
const { GraphQLFileLoader } = require('@graphql-toolkit/graphql-file-loader')

module.exports.diff = async function diff([leftPath, rightPath], flags) {
  let [leftSchema, rightSchema] = await Promise.all([
    loadSchema(leftPath, {
      loaders: [new UrlLoader(), new JsonFileLoader(), new GraphQLFileLoader()],
      assumeValid: true,
    }),
    loadSchema(rightPath, {
      loaders: [new UrlLoader(), new JsonFileLoader(), new GraphQLFileLoader()],
      assumeValid: true,
    }),
  ])

  if (!leftSchema || !rightSchema) {
    throw new Error('Schemas not defined')
  }

  const [leftSchemaSDL, rightSchemaSDL] = [
    printSchema(leftSchema),
    printSchema(rightSchema),
  ]

  const breakingChanges = findBreakingChanges(leftSchema, rightSchema)
  if (breakingChanges.length > 0) {
    console.log(`Breaking changes from ${leftPath} to ${rightPath}: `)
    breakingChanges.forEach(({ description }) =>
      console.error(`  ${description}`),
    )
  }

  const dangerousChanges = findDangerousChanges(leftSchema, rightSchema)
  if (dangerousChanges.length > 0) {
    console.log(`Dangerous changes from ${leftPath} to ${rightPath}: `)
    dangerousChanges.forEach(({ description }) =>
      console.error(`  ${description}`),
    )
  }
  if (
    (breakingChanges.length > 0 || dangerousChanges.length > 0) &&
    flags.fail
  ) {
    process.exit(1)
  } else {
    process.exit(0)
  }
}
