package database

import (
	"context"
	"fmt"

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

func UpsertFinding(ctx context.Context, db arangodb.Database, finding model.FindingEvent) error {
	findingsCol, err := db.GetCollection(ctx, "additionalFindings", nil)
	if err != nil {
		fmt.Println("failed to find collection")
		return err
	}

	key := finding.GetKey()

	findingExists, err := findingsCol.DocumentExists(ctx, key)
	if err != nil {
		fmt.Println("failed to find collection")
		return err
	}

	if findingExists {
		_, err := findingsCol.UpdateDocument(ctx, key, finding)
		if err != nil {
			fmt.Println("failed to update finding doc")
			return err
		}
	} else {
		_, err := findingsCol.CreateDocument(ctx, finding)
		if err != nil {
			fmt.Println("failed to create doc")
			return err
		}
	}

	return nil
}
