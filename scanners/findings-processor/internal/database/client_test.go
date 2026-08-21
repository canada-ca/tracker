package database

import (
	"errors"
	"testing"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/arangodb/go-driver/v2/connection"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

func TestCreateDBClient(t *testing.T) {
	originalSetAuthentication := setAuthentication
	originalNewArangoClient := newArangoClient
	t.Cleanup(func() {
		setAuthentication = originalSetAuthentication
		newArangoClient = originalNewArangoClient
	})

	t.Run("returns client on success", func(t *testing.T) {
		cfg := config.Config{DBURL: "http://localhost:8529", DBUser: "root", DBPassword: "openSesame"}

		setAuthentication = originalSetAuthentication
		newArangoClient = originalNewArangoClient

		client, err := CreateDBClient(cfg)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if client == nil {
			t.Fatal("expected client, got nil")
		}
	})

	t.Run("returns error when authentication setup fails", func(t *testing.T) {
		cfg := config.Config{DBURL: "http://localhost:8529", DBUser: "root", DBPassword: "bad"}
		errWant := errors.New("auth failed")

		setAuthentication = func(connection.Connection, connection.Authentication) error {
			return errWant
		}
		newArangoClient = originalNewArangoClient

		_, err := CreateDBClient(cfg)
		if !errors.Is(err, errWant) {
			t.Fatalf("expected auth error, got %v", err)
		}
	})

	t.Run("uses injected client factory", func(t *testing.T) {
		cfg := config.Config{DBURL: "http://localhost:8529", DBUser: "root", DBPassword: "ok"}

		setAuthentication = originalSetAuthentication
		newArangoClient = func(connection.Connection) arangodb.Client {
			return nil
		}

		client, err := CreateDBClient(cfg)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if client != nil {
			t.Fatalf("expected injected nil client, got %#v", client)
		}
	})
}
