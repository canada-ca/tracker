package database

import (
	"context"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/rs/zerolog/log"
)

func UpsertFinding(ctx context.Context, db arangodb.Database, evt model.FindingEvent) error {
	findingsCol, err := db.GetCollection(ctx, "additionalFindings", nil)
	if err != nil {
		log.Warn().Err(err).Msg("failed to find collection")
		return err
	}

	key := evt.GetKey()

	findingExists, err := findingsCol.DocumentExists(ctx, key)
	if err != nil {
		log.Warn().Err(err).Msg("failed to find collection")
		return err
	}

	if findingExists {
		var finding model.FindingDocument
		_, err := findingsCol.ReadDocument(ctx, key, &finding)
		if err != nil {
			log.Warn().Err(err).Msg("failed to read finding doc")
			return err
		}

		patch := map[string]interface{}{
			"lastSeen":       evt.ObservedAt,
			"occurenceCount": finding.OccurrenceCount + 1,
		}

		_, err = findingsCol.UpdateDocument(ctx, key, patch)
		if err != nil {
			log.Warn().Err(err).Msg("failed to update finding doc")
			return err
		}
	} else {
		newDoc, err := model.NewFindingDocumentFromEvent(evt)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}

		_, err = findingsCol.CreateDocument(ctx, newDoc)
		if err != nil {
			log.Warn().Err(err).Msg("failed to create doc")
			return err
		}
	}

	return nil
}
