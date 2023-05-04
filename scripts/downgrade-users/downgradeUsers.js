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

for await (const [key, val] of downgradeUserList.entries()) {
  try {
    const updateRoleRes = await changeUserRole({ email: val.userName, orgId: val.organizationId, role: "USER" });
    if (updateRoleRes.data.updateUserRole.result["__typename"] === "AffiliationError") {
      console.error(
        `Error while updating "${val.email}" permission for organization "${val.organizationId}" to "USER": `,
        val
      );
      downgradeUserList[key].success = false;
      downgradeUserList[key].error = updateRoleRes.data.updateUserRole.result.description;
      continue;
    }
  } catch (e) {
    console.error(
      `Error while updating "${val.email}" permission for organization "${val.organizationId}" to "USER": `,
      val
    );
    downgradeUserList[key].success = false;
    downgradeUserList[key].error = e;
  }
  downgradeUserList[key].success = true;
  console.log(
    `Successfully changed "${val.email}" permission for organization "${val.organizationId}" to "USER": `,
    val
  );
}

for (const val of downgradeUserList) {
  if (val.error) {
    console.error(
      `Error while updating "${val.email}" permission for organization "${val.organizationId}" to "USER": `,
      val
    );
  }
}

console.table(downgradeUserList.filter((val) => val.success === false));
