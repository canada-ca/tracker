const AUTH_TOKEN = "";
const TRACKER_GRAPHQL_URI = "";

if (!AUTH_TOKEN) {
  console.error("You must enter your auth token!");
}

if (!TRACKER_GRAPHQL_URI) {
  console.error("You must enter the Tracker graphql URI!");
}

const csv2json = (str, delimiter = ",") => {
  const titles = str
    .slice(0, str.indexOf("\n"))
    .replace(/["']/g, "")
    .split(delimiter)
    .map((str) => str.trim());
  const rows = str.slice(str.indexOf("\n") + 1).split("\n");
  return rows.map((row) => {
    const values = row.split(delimiter);
    return titles.reduce((object, curr, i) => {
      object[curr] = values[i].replace(/["']/g, "").trim();
      return object;
    }, {});
  });
};

const getOrg = async (orgSlug) => {
  const res = await fetch(TRACKER_GRAPHQL_URI, {
    body: JSON.stringify({
      query: `query {
            findOrganizationBySlug(orgSlug: "${orgSlug}") {
                id
                name
                slug
            }
        }`,
    }),
    headers: {
      Accept: "application/json",
      Authorization: AUTH_TOKEN,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  return (await res.json()).data;
};

const changeUserRole = async ({ email, role = "USER", orgId }) => {
  const res = await fetch(TRACKER_GRAPHQL_URI, {
    body: JSON.stringify({
      query: `mutation {
                updateUserRole(input: {
                  userName: "${email}",
                  role: ${role},
                  orgId: "${orgId}",
                }) {
                  result {
                    ...on UpdateUserRoleResult {
                      status
                    }
                    ...on AffiliationError {
                      code
                      description
                    }
                    __typename
                  }
                }
              }`,
    }),
    headers: {
      Accept: "application/json",
      Authorization: AUTH_TOKEN,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return await res.json();
};

const [fileHandle] = await window.showOpenFilePicker();
const file = await fileHandle.getFile();
const content = (await file.text()).trim();
const downgradeUserList = csv2json(content, ",");

// for await (const [key, inv] of downgradeUserList.entries()) {
//   try {
//     const data = await getOrg(inv.orgSlug);
//     downgradeUserList[key].orgId = data.findOrganizationBySlug.id;
//     const inviteRes = await inviteUser({ email: inv.email, orgId: inv.orgId, role: inv.role });
//     if (inviteRes.data.inviteUserToOrg.result["__typename"] === "AffiliationError") {
//       console.error(`Error while inviting ${inv.email} to ${inv.orgSlug}: `, inv);
//       downgradeUserList[key].success = false;
//       downgradeUserList[key].error = inviteRes.data.inviteUserToOrg.result.description;
//       continue;
//     }
//   } catch (e) {
//     console.error(`Error while inviting ${inv.email} to ${inv.orgSlug}: `, inv);
//     downgradeUserList[key].success = false;
//     downgradeUserList[key].error = e;
//   }
//   downgradeUserList[key].success = true;
//   console.log(`Successfully invited ${inv.email} to ${inv.orgSlug}: `, inv);
// }
//
// for (const inv of downgradeUserList) {
//   if (inv.error) {
//     console.error(`Error while inviting ${inv.email} to ${inv.orgSlug}: `, inv);
//   }
// }
//
// console.table(downgradeUserList.filter((inv) => inv.success === false));
