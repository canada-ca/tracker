/*
 * As we're exploring the data, we're doing queries that are slightly different
 * from what the API is doing. The result is a realization that some additional
 * fields on edges would be helpful for constraining traversals... specifically
 * adding timestamps to edges so that we can easily get the latest scan results
 * for a domain.
 * This script does that. It goes through the timestamped results and adds that
 * timestamp to the edges that point to that result.
 */
db._useDatabase("track_dmarc");

function print(obj) {
  JSON.stringify(console.log(obj), null, 2);
}

let collections = {
  domainsSPF: "spf",
  domainsSSL: "ssl",
  domainsDKIM: "dkim",
  domainsDMARC: "dmarc",
  domainsHTTPS: "https",
};

for (let [edgeCollection, vertexCollection] of Object.entries(collections)) {
  let ec = db._collection(edgeCollection);
  let vc = db._collection(vertexCollection);
  let { stats } = db
    ._query(
      aql`
      FOR result IN ${vc}
        LET doc = (FIRST(FOR edge IN ${ec} FILTER edge._to == result._id RETURN edge))
        UPSERT { _id: doc._id, _to: result._id  }
        INSERT MERGE(doc, { timestamp: result.timestamp  })
        UPDATE MERGE(doc, { timestamp: result.timestamp  })
        IN ${ec}
  `
    )
    .getExtra();

  print({ edgeCollection, vertexCollection, stats });
}

console.log({ done: true });
