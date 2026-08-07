package database

import (
	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/arangodb/go-driver/v2/connection"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

func CreateDBClient(cfg config.Config) (arangodb.Client, error) {
	// Setup a client connection
	endpoint := connection.NewRoundRobinEndpoints([]string{cfg.DBURL})
	conn := connection.NewHttp2Connection(connection.DefaultHTTP2ConfigurationWrapper(endpoint, false))

	// Add authentication
	auth := connection.NewBasicAuth(cfg.DBUser, cfg.DBPassword)
	err := conn.SetAuthentication(auth)
	if err != nil {
		return nil, err
	}

	// Create a client
	client := arangodb.NewClient(conn)
	return client, nil
}
