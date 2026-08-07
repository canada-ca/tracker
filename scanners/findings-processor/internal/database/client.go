package database

import (
	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/arangodb/go-driver/v2/connection"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

var (
	newEndpoints = connection.NewRoundRobinEndpoints
	newConnection = connection.NewHttp2Connection
	defaultHTTP2Config = connection.DefaultHTTP2ConfigurationWrapper
	newBasicAuth = connection.NewBasicAuth
	setAuthentication = func(conn connection.Connection, auth connection.Authentication) error {
		return conn.SetAuthentication(auth)
	}
	newArangoClient = arangodb.NewClient
)

func CreateDBClient(cfg config.Config) (arangodb.Client, error) {
	// Setup a client connection
	endpoint := newEndpoints([]string{cfg.DBURL})
	conn := newConnection(defaultHTTP2Config(endpoint, false))

	// Add authentication
	auth := newBasicAuth(cfg.DBUser, cfg.DBPassword)
	err := setAuthentication(conn, auth)
	if err != nil {
		return nil, err
	}

	// Create a client
	client := newArangoClient(conn)
	return client, nil
}
