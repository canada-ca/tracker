/*
 * It seems that for historical reasons we have a handful (~7) of records in
 * each of our scan collections that aren't actually connected to a domain at
 * all.
 * This complicate writing queries, creating situations where things are
 * suddenly null.
 * This script looks in those scan collections, determines which results don't
 * have edges connecting them to a domain and deletes them.
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
   LET edges = (FOR edge IN ${ec} RETURN DISTINCT edge._to)
   LET results = (FOR result IN ${vc} RETURN result._id)
   LET orphans = (MINUS(results, edges))
   LET rm = (FOR orphan in orphans REMOVE {_key: LAST(SPLIT(orphan, "/"))} IN ${vc})
   RETURN "done"
  `
    )
    .getExtra();

  print({ edgeCollection, vertexCollection, stats });
}

console.log({ done: true });
