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
	readFindingDocument = func(ctx context.Context, db arangodb.Database, key string) (*model.FindingDocument, error) {
		var finding model.FindingDocument
		options := arangodb.QueryOptions{
			Count: true,
			BindVars: map[string]interface{}{
				"key": key,
			},
		}
		query := "FOR f IN additionalFindings FILTER f.findingKey == @key LIMIT 1 RETURN f"

		cursor, err := db.Query(ctx, query, &options)
		if err != nil {
			return nil, err
		}
		defer cursor.Close()

		if cursor.Count() == 0 {
			return nil, nil
		}

		if _, err := cursor.ReadDocument(ctx, &finding); err != nil {
			return nil, err
		}
		return &finding, nil
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

	key := evt.DeriveFindingKey()

	finding, err := readFindingDocument(ctx, db, key)
	if err != nil {
		log.Warn().Err(err).Msg("failed to check finding existence")
		return err
	}

	if finding != nil {
		patch := findingUpdatePatch{
			LastSeen:        evt.ObservedAt,
			OccurrenceCount: finding.OccurrenceCount + 1,
		}

		err = updateFindingDocument(ctx, findingsCol, finding.Key, patch)
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
