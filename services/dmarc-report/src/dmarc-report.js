module.exports.dmarcReport = async ({
  ownerships,
  createOwnership,
  removeOwnership,
  removeSummary,
  loadArangoDates,
  loadArangoThirtyDaysCount,
  loadCheckOrg,
  loadCheckDomain,
  loadOrgOwner,
  createSummary,
  upsertSummary,
  cosmosDates,
  currentDate,
}) => {
  // get org acronyms
  const orgAcronyms = Object.keys(ownerships)

  // loop through orgs
  for (const orgAcronymEn of orgAcronyms) {
    // check if org exists
    const checkOrg = await loadCheckOrg({ orgAcronymEn })
    if (!checkOrg) {
      console.warn(`Org: ${orgAcronymEn} cannot be found in datastore`)
      continue
    }

    console.info(`Updating DMARC summary info for org: ${String(orgAcronymEn)}`)

    // loop through the domains
    for (const domain of ownerships[orgAcronymEn]) {
      // check to see if domain exists
      const checkDomain = await loadCheckDomain({ domain })
      if (!checkDomain) {
        console.warn(`\t${domain} cannot be found in the datastore`)
        continue
      }

      console.info(`\tWorking on domain: ${domain}`)

      // get the current owner of the domain
      const orgOwner = await loadOrgOwner({
        domain,
      })

      // if the domain is not owned create ownership
      if (!orgOwner) {
        console.info(
          `\t\tAssigning ${domain} ownership to: ${String(orgAcronymEn)}`,
        )
        await createOwnership({ domain, orgAcronymEn })
      }
      // if the domain is owned by another org, remove ownership and assign a new one
      else if (orgOwner !== orgAcronymEn) {
        console.info(`\t\tRemoving ${domain} ownership to: ${domain}`)
        await removeOwnership({ domain, orgAcronymEn })

        console.info(
          `\t\tAssigning ${domain} ownership to: ${String(orgAcronymEn)}`,
        )
        await createOwnership({ domain, orgAcronymEn })
      } else {
        console.info(
          `\t\tOwnership of ${domain} is already assigned to ${String(
            orgAcronymEn,
          )}`,
        )
      }

      const arangoDates = await loadArangoDates({ domain })

      for (const date of arangoDates) {
        if (cosmosDates.indexOf(date) === -1) {
          // remove periods in arango
          console.info(`\t\tRemoving ${date} for ${domain}`)
          await removeSummary({
            domain,
            date,
          })
        }
      }

      // handle non thirty day dates
      for (const date of cosmosDates) {
        // if date is not in arango initialize it
        if (arangoDates.indexOf(date) === -1) {
          // initialize summary
          console.info(`\t\tInitializing ${date} for ${domain}`)
          await createSummary({
            date,
            domain,
          })
        } else if (date === currentDate) {
          // update current month
          console.info(`\t\tUpdating ${date} for ${domain}`)
          await upsertSummary({ date, domain })
        }
      }

      // handle thirty day dates
      const thirtyDayCount = await loadArangoThirtyDaysCount({
        domain,
      })

      // check to see if thirty days period is found in the arango
      if (thirtyDayCount === 0) {
        // initialize thirty day summary if not found in arango
        console.info(`\t\tInitializing Thirty Days for ${domain}`)
        await createSummary({
          date: 'thirtyDays',
          domain,
        })
      } else {
        // update thirty day summary
        console.info(`\t\tUpdating Thirty Days for ${domain}`)
        await upsertSummary({ date: 'thirtyDays', domain })
      }
    }
  }

  console.info('Completed assigning ownerships.')
}
