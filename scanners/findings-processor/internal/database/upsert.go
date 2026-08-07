package database

import (
	"context"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/rs/zerolog/log"
)

var (
	getCollection = func(ctx context.Context, db arangodb.Database, name string) (arangodb.Collection, error) {
		return db.GetCollection(ctx, name, nil)
	}
	documentExists = func(ctx context.Context, col arangodb.Collection, key string) (bool, error) {
		return col.DocumentExists(ctx, key)
	}
	readDocument = func(ctx context.Context, col arangodb.Collection, key string, result any) error {
		_, err := col.ReadDocument(ctx, key, result)
		return err
	}
	updateDocument = func(ctx context.Context, col arangodb.Collection, key string, patch any) error {
		_, err := col.UpdateDocument(ctx, key, patch)
		return err
	}
	createDocument = func(ctx context.Context, col arangodb.Collection, doc any) error {
		_, err := col.CreateDocument(ctx, doc)
		return err
	}
	newDocumentFromEvent = model.NewFindingDocumentFromEvent
)

func UpsertFinding(ctx context.Context, db arangodb.Database, evt model.FindingEvent) error {
	findingsCol, err := getCollection(ctx, db, "additionalFindings")
	if err != nil {
		log.Warn().Err(err).Msg("failed to find collection")
		return err
	}

	key := evt.GetKey()

	findingExists, err := documentExists(ctx, findingsCol, key)
	if err != nil {
		log.Warn().Err(err).Msg("failed to find collection")
		return err
	}

	if findingExists {
		var finding model.FindingDocument
		err := readDocument(ctx, findingsCol, key, &finding)
		if err != nil {
			log.Warn().Err(err).Msg("failed to read finding doc")
			return err
		}

		patch := map[string]interface{}{
			"lastSeen":       evt.ObservedAt,
			"occurenceCount": finding.OccurrenceCount + 1,
		}

		err = updateDocument(ctx, findingsCol, key, patch)
		if err != nil {
			log.Warn().Err(err).Msg("failed to update finding doc")
			return err
		}
	} else {
		newDoc, err := newDocumentFromEvent(evt)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}

		err = createDocument(ctx, findingsCol, newDoc)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}
	}

	return nil
}
