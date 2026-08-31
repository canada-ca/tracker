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

func readFindingDocument(ctx context.Context, db arangodb.Database, key string) (*model.FindingDocument, error) {
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

func UpsertFinding(ctx context.Context, db arangodb.Database, evt model.FindingEvent) error {
	findingsCol, err := db.GetCollection(ctx, "additionalFindings", nil)
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

		if _, err := findingsCol.UpdateDocument(ctx, finding.Key, patch); err != nil {
			log.Warn().Err(err).Msg("failed to update finding doc")
			return err
		}
	} else {
		newDoc, err := model.NewFindingDocumentFromEvent(evt)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}

		if _, err := findingsCol.CreateDocument(ctx, newDoc); err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}
	}

	return nil
}
