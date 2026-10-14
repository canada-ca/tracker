package database

import (
	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/arangodb/go-driver/v2/connection"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

func CreateDBClient(cfg config.Config) (arangodb.Client, error) {
	endpoint := connection.NewRoundRobinEndpoints([]string{cfg.DBURL})
	conn := connection.NewHttp2Connection(connection.DefaultHTTP2ConfigurationWrapper(endpoint, false))

	auth := connection.NewBasicAuth(cfg.DBUser, cfg.DBPassword)
	if err := conn.SetAuthentication(auth); err != nil {
		return nil, err
	}

	return arangodb.NewClient(conn), nil
}
