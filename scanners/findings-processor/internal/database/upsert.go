package database

import (
	"context"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/rs/zerolog/log"
)

type findingUpdatePatch struct {
	LastSeen        string `json:"lastSeen"`
	OccurrenceCount int    `json:"occurrenceCount"`
}

var (
	getCollection = func(ctx context.Context, db arangodb.Database, name string) (arangodb.Collection, error) {
		return db.GetCollection(ctx, name, nil)
	}
	documentExists = func(ctx context.Context, col arangodb.Collection, key string) (bool, error) {
		return col.DocumentExists(ctx, key)
	}
	readFindingDocument = func(ctx context.Context, col arangodb.Collection, key string, result *model.FindingDocument) error {
		_, err := col.ReadDocument(ctx, key, result)
		return err
	}
	updateFindingDocument = func(ctx context.Context, col arangodb.Collection, key string, patch findingUpdatePatch) error {
		_, err := col.UpdateDocument(ctx, key, patch)
		return err
	}
	createFindingDocument = func(ctx context.Context, col arangodb.Collection, doc model.FindingDocument) error {
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
		err := readFindingDocument(ctx, findingsCol, key, &finding)
		if err != nil {
			log.Warn().Err(err).Msg("failed to read finding doc")
			return err
		}

		patch := findingUpdatePatch{
			LastSeen:        evt.ObservedAt,
			OccurrenceCount: finding.OccurrenceCount + 1,
		}

		err = updateFindingDocument(ctx, findingsCol, key, patch)
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

		err = createFindingDocument(ctx, findingsCol, newDoc)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}
	}

	return nil
}
