# Tracker API

The Tracker API is exclusively focused on serving data, rather than HTML. It is a GraphQL API, chosen because of its [composability](https://en.wikipedia.org/wiki/Composability), [legibility](https://www.ribbonfarm.com/2010/07/26/a-big-little-idea-called-legibility/) and for the way it [enables both security and security automation](https://www.youtube.com/watch?v=gqvyCdyp3Nw).
It is built with the [Express webserver](https://expressjs.com/) using the [express-graphql middleware](https://github.com/graphql/express-graphql), and follows the [Relay specifications for pagination](https://relay.dev/graphql/connections.htm).

#### Installing Dependencies

```shell
npm install
```
#### Running API Server

In accordance with the [12Factor app](https://12factor.net) philosophy, the server [draws it's config from the environment](https://12factor.net/config). It does based on a `.env` file that should exist in the root of the API folder which can be created with the following command, obviously modifying the test values shown to suit your setup.

```bash
cat <<'EOF' > test.env
DB_PASS=test
DB_URL=http://localhost:8529
DB_NAME=track_dmarc
AUTHENTICATED_KEY=12341234
SIGN_IN_KEY=12341234
NOTIFICATION_API_KEY=asdf1234
NOTIFICATION_API_URL=https://api.notification.alpha.canada.ca
DMARC_REPORT_API_SECRET=somesecretvalue
TOKEN_HASH=somehash
DMARC_REPORT_API_TOKEN=uuid-like-string
DMARC_REPORT_API_URL=http://localhost:4001/graphql
DEPTH_LIMIT=5
COST_LIMIT=100
SCALAR_COST=1
OBJECT_COST=1
LIST_FACTOR=1
CIPHER_KEY=1234asdf
DNS_SCANNER_ENDPOINT=dns.scanners
HTTPS_SCANNER_ENDPOINT=https.scanners
SSL_SCANNER_ENDPOINT=ssl.scanners
EOF
```
With that defined you can start the server with these commands.

```shell
# Compile the scripts 
npm run build
# Run the server
npm start
```

An online IDE will be accessible at [localhost:4000/graphql](http://localhost:4000/graphql) allowing you to explore the API.

### Dev Workflow

#### Install Dev Dependencies
```shell
npm install
```

#### Running Server with Nodemon
```shell
npm run dev-start
```

#### Running Tests

The tests require a copy of [ArangoDB](https://www.arangodb.com/) to be running locally. ArangoDB should have it's own .env file, and the value of the root password should align with the value of `DB_PASS` in the APIs `test.env` file.

```bash
# Write the arango test credentials into an env file:
echo ARANGO_ROOT_PASSWORD=test > arangodb.env
# Run a detached arangodb container using the root password from the env:
docker run -d -p=8529:8529 --env-file arangodb.env --name=arango arangodb
```

With the database running, we need create the environment variables the application needs, but with some test appropriate values. We can do that by creating `test.env` in the API root directory with the following command.

```bash
cat <<'EOF' > test.env
DB_PASS=test
DB_URL=http://localhost:8529
DB_NAME=track_dmarc
AUTHENTICATED_KEY=12341234
SIGN_IN_KEY=12341234
NOTIFICATION_API_KEY=asdf1234
NOTIFICATION_API_URL=https://api.notification.alpha.canada.ca
DMARC_REPORT_API_SECRET=somesecretvalue
TOKEN_HASH=somehash
DMARC_REPORT_API_TOKEN=uuid-like-string
DMARC_REPORT_API_URL=http://localhost:4001/graphql
DEPTH_LIMIT=5
COST_LIMIT=100
SCALAR_COST=1
OBJECT_COST=1
LIST_FACTOR=1
EOF
```

Finally, run the tests.

```bash
npm test
```

#### Checking Test Coverage

```shell
npm run test-coverage
```

#### Running ESLint

```shell
npm run lint
```

#### Formatting Code with Prettier
```shell
npm run prettier
```
