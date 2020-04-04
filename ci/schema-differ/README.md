# Schema Differ

This is a little command line tool we use in CI to keep the schema of the API
and the frontend in sync. There are other tools that do this, but they are
confused by graphql-fakers directives which are used to supply mock data.
