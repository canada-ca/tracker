import {aql} from 'arangojs'
import {fromGlobalId, toGlobalId} from 'graphql-relay'
import {t} from '@lingui/macro'

export const loadDkimGuidanceTagConnectionsByTagId =
  ({query, userKey, cleanseInput, i18n, language}) =>
    async ({dkimGuidanceTags, after, before, first, last, orderBy}) => {
      let afterTemplate = aql``
      let afterVar = aql``
      if (typeof after !== 'undefined') {
        const {id: afterId} = fromGlobalId(cleanseInput(after))
        if (typeof orderBy === 'undefined') {
          afterTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(${afterId}, "[a-z]+")[1])`
        } else {
          let afterTemplateDirection
          if (orderBy.direction === 'ASC') {
            afterTemplateDirection = aql`>`
          } else {
            afterTemplateDirection = aql`<`
          }

          afterVar = aql`LET afterVar = DOCUMENT(dkimGuidanceTags, ${afterId})`

          let tagField, documentField
          /* istanbul ignore else */
          if (orderBy.field === 'tag-id') {
            tagField = aql`tag._key`
            documentField = aql`afterVar._key`
          } else if (orderBy.field === 'tag-name') {
            tagField = aql`TRANSLATE(${language}, tag).tagName`
            documentField = aql`TRANSLATE(${language}, afterVar).tagName`
          } else if (orderBy.field === 'guidance') {
            tagField = aql`TRANSLATE(${language}, tag).guidance`
            documentField = aql`TRANSLATE(${language}, afterVar).guidance`
          }

          afterTemplate = aql`
        FILTER ${tagField} ${afterTemplateDirection} ${documentField}
        OR (${tagField} == ${documentField}
        AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(${afterId}, "[a-z]+")[1]))
      `
        }
      }

      let beforeTemplate = aql``
      let beforeVar = aql``
      if (typeof before !== 'undefined') {
        const {id: beforeId} = fromGlobalId(cleanseInput(before))
        if (typeof orderBy === 'undefined') {
          beforeTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(${beforeId}, "[a-z]+")[1])`
        } else {
          let beforeTemplateDirection
          if (orderBy.direction === 'ASC') {
            beforeTemplateDirection = aql`<`
          } else {
            beforeTemplateDirection = aql`>`
          }

          beforeVar = aql`LET beforeVar = DOCUMENT(dkimGuidanceTags, ${beforeId})`

          let tagField, documentField
          /* istanbul ignore else */
          if (orderBy.field === 'tag-id') {
            tagField = aql`tag._key`
            documentField = aql`beforeVar._key`
          } else if (orderBy.field === 'tag-name') {
            tagField = aql`TRANSLATE(${language}, tag).tagName`
            documentField = aql`TRANSLATE(${language}, beforeVar).tagName`
          } else if (orderBy.field === 'guidance') {
            tagField = aql`TRANSLATE(${language}, tag).guidance`
            documentField = aql`TRANSLATE(${language}, beforeVar).guidance`
          }

          beforeTemplate = aql`
        FILTER ${tagField} ${beforeTemplateDirection} ${documentField}
        OR (${tagField} == ${documentField}
        AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(${beforeId}, "[a-z]+")[1]))
      `
        }
      }

      let limitTemplate = aql``
      if (typeof first === 'undefined' && typeof last === 'undefined') {
        console.warn(
          `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDkimGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(
          i18n._(
            t`You must provide a \`first\` or \`last\` value to properly paginate the \`GuidanceTag\` connection.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
        console.warn(
          `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDkimGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(
          i18n._(
            t`Passing both \`first\` and \`last\` to paginate the \`GuidanceTag\` connection is not supported.`,
          ),
        )
      } else if (typeof first === 'number' || typeof last === 'number') {
        /* istanbul ignore else */
        if (first < 0 || last < 0) {
          const argSet = typeof first !== 'undefined' ? 'first' : 'last'
          console.warn(
            `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDkimGuidanceTagConnectionsByTagId.`,
          )
          throw new Error(
            i18n._(
              t`\`${argSet}\` on the \`GuidanceTag\` connection cannot be less than zero.`,
            ),
          )
        } else if (first > 100 || last > 100) {
          const argSet = typeof first !== 'undefined' ? 'first' : 'last'
          const amount = typeof first !== 'undefined' ? first : last
          console.warn(
            `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDkimGuidanceTagConnectionsByTagId.`,
          )
          throw new Error(
            i18n._(
              t`Requesting \`${amount}\` records on the \`GuidanceTag\` connection exceeds the \`${argSet}\` limit of 100 records.`,
            ),
          )
        } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
          limitTemplate = aql`TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ASC LIMIT TO_NUMBER(${first})`
        } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
          limitTemplate = aql`TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) DESC LIMIT TO_NUMBER(${last})`
        }
      } else {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDkimGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(
          i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
        )
      }

      let hasNextPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedDkimGuidanceTags)._key, "[a-z]+")[1])`
      let hasPreviousPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedDkimGuidanceTags)._key, "[a-z]+")[1])`
      if (typeof orderBy !== 'undefined') {
        let hasNextPageDirection
        let hasPreviousPageDirection
        if (orderBy.direction === 'ASC') {
          hasNextPageDirection = aql`>`
          hasPreviousPageDirection = aql`<`
        } else {
          hasNextPageDirection = aql`<`
          hasPreviousPageDirection = aql`>`
        }

        let tagField, hasNextPageDocument, hasPreviousPageDocument
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          tagField = aql`tag._key`
          hasNextPageDocument = aql`LAST(retrievedDkimGuidanceTags)._key`
          hasPreviousPageDocument = aql`FIRST(retrievedDkimGuidanceTags)._key`
        } else if (orderBy.field === 'tag-name') {
          tagField = aql`TRANSLATE(${language}, tag).tagName`
          hasNextPageDocument = aql`LAST(retrievedDkimGuidanceTags).tagName`
          hasPreviousPageDocument = aql`FIRST(retrievedDkimGuidanceTags).tagName`
        } else if (orderBy.field === 'guidance') {
          tagField = aql`TRANSLATE(${language}, tag).guidance`
          hasNextPageDocument = aql`LAST(retrievedDkimGuidanceTags).guidance`
          hasPreviousPageDocument = aql`FIRST(retrievedDkimGuidanceTags).guidance`
        }

        hasNextPageFilter = aql`
      FILTER ${tagField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${tagField} == ${hasNextPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedDkimGuidanceTags)._key, "[a-z]+")[1]))
    `

        hasPreviousPageFilter = aql`
      FILTER ${tagField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${tagField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedDkimGuidanceTags)._key, "[a-z]+")[1]))
    `
      }

      let sortByField = aql``
      if (typeof orderBy !== 'undefined') {
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          sortByField = aql`tag._key ${orderBy.direction},`
        } else if (orderBy.field === 'tag-name') {
          sortByField = aql`TRANSLATE(${language}, tag).tagName ${orderBy.direction},`
        } else if (orderBy.field === 'guidance') {
          sortByField = aql`TRANSLATE(${language}, tag).guidance ${orderBy.direction},`
        }
      }

      let sortString
      if (typeof last !== 'undefined') {
        sortString = aql`DESC`
      } else {
        sortString = aql`ASC`
      }

      let dkimGuidanceTagInfoCursor
      try {
        dkimGuidanceTagInfoCursor = await query`
      WITH dkimGuidanceTags

      ${afterVar}
      ${beforeVar}

      LET retrievedDkimGuidanceTags = (
        FOR tag IN dkimGuidanceTags
          FILTER tag._key IN ${dkimGuidanceTags}
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE(
            {
              _id: tag._id,
              _key: tag._key,
              _rev: tag._rev,
              _type: "guidanceTag",
              id: tag._key,
              tagId: tag._key
            },
            TRANSLATE(${language}, tag)
          )
      )

      LET hasNextPage = (LENGTH(
        FOR tag IN dkimGuidanceTags
          FILTER tag._key IN ${dkimGuidanceTags}
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR tag IN dkimGuidanceTags
          FILTER tag._key IN ${dkimGuidanceTags}
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      RETURN {
        "dkimGuidanceTags": retrievedDkimGuidanceTags,
        "totalCount": LENGTH(${dkimGuidanceTags}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedDkimGuidanceTags)._key,
        "endKey": LAST(retrievedDkimGuidanceTags)._key
      }
    `
      } catch (err) {
        console.error(
          `Database error occurred while user: ${userKey} was trying to gather orgs in loadDkimGuidanceTagConnectionsByTagId, error: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to load DKIM guidance tag(s). Please try again.`),
        )
      }

      let dkimGuidanceTagInfo
      try {
        dkimGuidanceTagInfo = await dkimGuidanceTagInfoCursor.next()
      } catch (err) {
        console.error(
          `Cursor error occurred while user: ${userKey} was trying to gather orgs in loadDkimGuidanceTagConnectionsByTagId, error: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to load DKIM guidance tag(s). Please try again.`),
        )
      }

      if (dkimGuidanceTagInfo.dkimGuidanceTags.length === 0) {
        return {
          edges: [],
          totalCount: 0,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: '',
            endCursor: '',
          },
        }
      }

      const edges = dkimGuidanceTagInfo.dkimGuidanceTags.map((tag) => ({
        cursor: toGlobalId('guidanceTag', tag._key),
        node: tag,
      }))

      return {
        edges,
        totalCount: dkimGuidanceTagInfo.totalCount,
        pageInfo: {
          hasNextPage: dkimGuidanceTagInfo.hasNextPage,
          hasPreviousPage: dkimGuidanceTagInfo.hasPreviousPage,
          startCursor: toGlobalId('guidanceTag', dkimGuidanceTagInfo.startKey),
          endCursor: toGlobalId('guidanceTag', dkimGuidanceTagInfo.endKey),
        },
      }
    }
