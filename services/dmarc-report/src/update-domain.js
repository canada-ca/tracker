const updateDomain = async ({
  loadCheckDomain,
  domain,
  loadOrgOwner,
  orgAcronym,
  createOwnership,
  orgAcronymEn,
  removeOwnership,
  loadArangoDates,
  cosmosDates,
  updateDomainMailStatus,
  removeSummary,
  createSummary,
  currentDate,
  upsertSummary,
  loadArangoThirtyDaysCount,
  loadTables,
}) => {
  // check to see if domain exists
  const checkDomain = await loadCheckDomain({ domain })
  if (!checkDomain) {
    console.warn(`\t${domain} cannot be found in the datastore`)
    return
  }

  console.info(`\tWorking on domain: ${domain}`)

  // get the current owner of the domain
  const orgOwner = await loadOrgOwner({
    domain,
  })

  // if the domain is not owned create ownership
  if (!orgOwner) {
    console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
    await createOwnership({ domain, orgAcronymEn })
  }
  // if the domain is owned by another org, remove ownership and assign a new one
  else if (orgOwner !== orgAcronymEn) {
    console.info(`\t\tRemoving ${domain} ownership from: ${orgOwner}`)
    await removeOwnership({ domain, orgAcronymEn })

    console.info(`\t\tAssigning ${domain} ownership to: ${String(orgAcronym)}`)
    await createOwnership({ domain, orgAcronymEn })
  } else {
    console.info(`\t\tOwnership of ${domain} is already assigned to ${String(orgAcronym)}`)
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

  // handle non-thirty day dates
  for (const date of cosmosDates) {
    // Get DMARC table data
    const { categoryTotals, categoryPercentages, detailTables } = await loadTables({
      domain,
      date,
    })
    // if date is not in arango initialize it
    if (arangoDates.indexOf(date) === -1) {
      // initialize summary
      console.info(`\t\tInitializing ${date} for ${domain}`)
      await createSummary({
        date,
        domain,
        categoryTotals,
        categoryPercentages,
        detailTables,
      })
    } else if (date === currentDate) {
      // update current month
      console.info(`\t\tUpdating ${date} for ${domain}`)
      await upsertSummary({ date, domain, categoryTotals, categoryPercentages, detailTables })
    }
  }

  // handle thirty-day dates
  const thirtyDayCount = await loadArangoThirtyDaysCount({
    domain,
  })

  const thirtyDayTables = await loadTables({
    domain,
    date: 'thirtyDays',
  })

  // check to see if thirty days period is found in the arango
  if (thirtyDayCount === 0) {
    // initialize thirty day summary if not found in arango
    console.info(`\t\tInitializing Thirty Days for ${domain}`)
    await createSummary({
      date: 'thirtyDays',
      domain,
      categoryTotals: thirtyDayTables.categoryTotals,
      categoryPercentages: thirtyDayTables.categoryPercentages,
      detailTables: thirtyDayTables.detailTables,
    })
  } else {
    // update thirty day summary
    console.info(`\t\tUpdating Thirty Days for ${domain}`)
    await upsertSummary({
      date: 'thirtyDays',
      domain,
      categoryTotals: thirtyDayTables.categoryTotals,
      categoryPercentages: thirtyDayTables.categoryPercentages,
      detailTables: thirtyDayTables.detailTables,
    })
  }

  // update domain mail status
  let sendsEmail = 'false'
  if (
    [
      thirtyDayTables.categoryTotals.pass,
      thirtyDayTables.categoryTotals.passDkimOnly,
      thirtyDayTables.categoryTotals.passSpfOnly,
    ].some((total) => total > 0)
  ) {
    sendsEmail = 'true'
  }
  console.info(`\t\tUpdating domain mail status for ${domain} to ${sendsEmail}`)
  await updateDomainMailStatus({ domain, sendsEmail })
}

module.exports = {
  updateDomain,
}
