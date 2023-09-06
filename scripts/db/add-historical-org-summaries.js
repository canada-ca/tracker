/*
 * This script will add historical org summaries to the database.
 * It will go through the historical results and add a summary of the results
 * to the database. This will allow us to easily graph the results over time.
 */
db._useDatabase("track_dmarc");
const charts = {
  // tier 1
  https: ["https"],
  dmarc: ["dmarc"],
  // tier 2
  web_connections: ["https", "hsts"],
  ssl: ["ssl"],
  spf: ["spf"],
  dkim: ["dkim"],
  // tier 3
  mail: ["dmarc", "spf", "dkim"],
  web: ["https", "hsts", "ssl"],
};

const removeDuplicates = ({ array, key }) => {
  let newArray = [];
  let uniqueObject = {};

  for (let i in array) {
    objDomain = array[i][key];
    uniqueObject[objDomain] = array[i];
  }

  for (i in uniqueObject) {
    newArray.push(uniqueObject[i]);
  }
  return newArray;
};

// get earliest timestamp for a scan
const earliestScan = db
  ._query(
    aql`
    FOR dnsScan IN dns
      SORT dnsScan.timestamp ASC
      LIMIT 1
      RETURN dnsScan.timestamp
    `
  )
  .toArray()[0];

// get all orgs
const allOrgs = db
  ._query(
    aql`
        FOR org IN organizations
            FILTER org.verified == true
            RETURN org
        `
  )
  .toArray();

// for each org
allOrgs.forEach((org) => {
  console.log(org.orgDetails.en.name);
  // get all claimed domains for the org
  const orgId = aql`${org._id}`;
  const orgDomainIds = db
    ._query(
      aql`
          FOR v, e IN 1..1 OUTBOUND ${orgId} claims
            OPTIONS {order: "bfs"}
            RETURN v.domain
        `
    )
    .toArray();

  const currentDay = new Date();
  const currentDateString = currentDay.toISOString().split("T")[0];
  while (currentDateString !== earliestScan.split(" ")[0]) {
    console.log(currentDateString);
    // get all scans for the current day
    const dailyScans = db
      ._query(
        aql`
            FOR dnsScan IN dns
                FILTER DATE_FORMAT(dnsScan.timestamp, '%yyyy-%mm-%dd') == DATE_FORMAT(${currentDay.toISOString()}, '%yyyy-%mm-%dd')
                FILTER dnsScan.domain IN ${orgDomainIds}
                RETURN dnsScan
            `
      )
      .toArray();

    console.log("DAILY SCANS ACQUIRED: ", dailyScans.length);
    // if no dns scans found, move on to next org
    if (dailyScans.length === 0) {
      // proceed to previous day
      currentDay.setDate(currentDay.getDate() - 1);
      continue;
    }

    // remove duplicate domains
    const uniqueDomains = removeDuplicates({ array: dailyScans, key: "domain" });
    console.log("UNIQUE DOMAINS: ", uniqueDomains.length);

    // format list of unique domains
    let scanList = {};
    uniqueDomains.forEach(({ dmarc, dkim, spf, domain, rcode }) => {
      if (rcode !== "NXDOMAIN") {
        scanList[domain] = {
          dmarcPhase: dmarc.phase || "info",
          dmarc: dmarc.status || "info",
          dkim: dkim.status || "info",
          spf: spf.status || "info",
          https: "info",
          hsts: "info",
          curve: "info",
          cipher: "info",
          protocol: "info",
          certificate: "info",
          ssl: "info",
        };
      }
    });

    // get all web scans for the current day
    const dailyWebScans = db
      ._query(
        aql`
      LET webIds = (
        FOR webScan IN web
            FILTER DATE_FORMAT(webScan.timestamp, '%yyyy-%mm-%dd') == DATE_FORMAT(${currentDay.toISOString()}, '%yyyy-%mm-%dd')
            FILTER webScan.domain IN ${orgDomainIds}
            RETURN {"_id": webScan._id, "domain": webScan.domain}
        )
        FOR webId IN webIds
          FOR edge IN webToWebScans
            FILTER edge._from == webId._id
            RETURN MERGE(DOCUMENT(edge._to), {"domain": webId.domain})
        `
      )
      .toArray()
      .filter((scan) => scan.status !== "pending");

    // remove duplicate domains
    const uniqueWebDomains = removeDuplicates({ array: dailyWebScans, key: "domain" });

    uniqueWebDomains.forEach((scan) => {
      try {
        const { httpsStatus = "info", hstsStatus = "info" } = scan.results.connectionResults;
        const {
          curveStatus = "info",
          cipherStatus = "info",
          protocolStatus = "info",
          certificateStatus = "info",
          sslStatus = "info",
        } = scan.results.tlsResult;
        if (scanList[scan.domain])
          scanList[scan.domain] = {
            ...scanList[scan.domain],
            https: httpsStatus || "info",
            hsts: hstsStatus || "info",
            curve: curveStatus || "info",
            cipher: cipherStatus || "info",
            protocol: protocolStatus || "info",
            certificate: certificateStatus || "info",
            ssl: sslStatus || "info",
          };
      } catch (err) {
        console.log(scan);
      }
    });

    const chartSummaries = {};
    // generate chart summaries
    for (const [key, val] of Object.entries(charts)) {
      chartSummaries[key] = {
        scanTypes: val,
        pass: 0,
        fail: 0,
        total: 0,
      };
    }

    let not_implemented_count = 0;
    let assess_count = 0;
    let deploy_count = 0;
    let enforce_count = 0;
    let maintain_count = 0;

    // add chart summaries to the database
    Object.keys(scanList).forEach((domain) => {
      const statuses = scanList[domain];

      for (const [_key, val] of Object.entries(chartSummaries)) {
        let chart = val;
        categoryStatus = [];
        for (const scanType of chart.scanTypes) {
          categoryStatus.push(statuses[scanType]);
        }
        if (categoryStatus.includes("fail")) {
          chart.fail += 1;
          chart.total += 1;
        } else if (!categoryStatus.includes("info")) {
          chart.pass += 1;
          chart.total += 1;
        }
      }
      switch (statuses.dmarcPhase) {
        case "not implemented":
          not_implemented_count += 1;
          break;
        case "assess":
          assess_count += 1;
          break;
        case "deploy":
          deploy_count += 1;
          break;
        case "enforce":
          enforce_count += 1;
          break;
        case "maintain":
          maintain_count += 1;
          break;
        default:
          break;
      }
    });

    const dmarcPhaseSummary = {
      not_implemented: not_implemented_count,
      assess: assess_count,
      deploy: deploy_count,
      enforce: enforce_count,
      maintain: maintain_count,
      total: not_implemented_count + assess_count + deploy_count + enforce_count + maintain_count,
    };

    // add summary to the database
    db.organizationSummaries.save({
      date: currentDateString,
      organization: org._id,
      dmarcPhase: dmarcPhaseSummary,
      ...chartSummaries,
    });

    // proceed to previous day
    currentDay.setDate(currentDay.getDate() - 1);
  }
});
