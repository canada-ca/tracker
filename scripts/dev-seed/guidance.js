// Port of services/guidance/guidance.py: loads guidance tags and summary criteria
// from services/guidance/guidance.json (read in place, not copied).
const path = require('node:path')
const { aql } = require('arangojs')

const GUIDANCE_FILE = path.resolve(__dirname, '../../services/guidance/guidance.json')

// Each entry describes the doc built from a source item and the fields the Python
// service writes on update. guidance.py inserts `warning` for scanSummaryCriteria but
// leaves it out of updates; that behaviour is kept as-is.
const scanSummaryCriteria = {
  collection: 'scanSummaryCriteria',
  build: (key, c) => ({ _key: key, pass: c.pass ?? [], fail: c.fail ?? [], warning: c.warning ?? [], info: c.info ?? [] }),
  updateFields: ['pass', 'fail', 'info'],
}
const chartSummaryCriteria = {
  collection: 'chartSummaryCriteria',
  build: (key, c) => ({ _key: key, pass: c.pass ?? [], fail: c.fail ?? [] }),
  updateFields: ['pass', 'fail'],
}
const guidanceTags = {
  collection: 'guidanceTags',
  build: (key, tag) => ({ _key: key, en: tag.en, fr: tag.fr }),
  updateFields: ['en', 'fr'],
}

const handlerForFile = (file) => {
  if (file === 'scanSummaryCriteria.json') return scanSummaryCriteria
  if (file === 'chartSummaryCriteria.json') return chartSummaryCriteria
  return guidanceTags
}

const pick = (doc, fields) => Object.fromEntries(fields.map((field) => [field, doc[field]]))

const loadGuidance = async (db) => {
  const entries = require(GUIDANCE_FILE)
  let written = 0
  for (const { file, guidance } of entries) {
    const { collection, build, updateFields } = handlerForFile(file)
    const target = db.collection(collection)
    for (const [key, source] of Object.entries(guidance)) {
      const doc = build(key, source)
      await db.query(aql`
        UPSERT { _key: ${key} }
          INSERT ${doc}
          UPDATE ${pick(doc, updateFields)}
          IN ${target}
      `)
      written += 1
    }
  }
  console.log(`Loaded ${written} guidance documents.`)
}

module.exports = { loadGuidance }
