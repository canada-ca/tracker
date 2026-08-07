package messaging

import (
	"context"
	"encoding/json"

	"github.com/arangodb/go-driver/v2/arangodb"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/database"
	"github.com/canada-ca/tracker/scanners/findings-processor/internal/model"
	"github.com/rs/zerolog/log"
)

func HandleEvent(ctx context.Context, db arangodb.Database, payload []byte) string {
	var evt model.FindingEvent
	if err := json.Unmarshal(payload, &evt); err != nil {
		log.Warn().Err(err).Msg("invalid json payload")
		return "term" // poison payload
	}

	if err := model.Validate(evt); err != nil {
		log.Warn().Err(err).Msg("invalid event payload")
		return "term" // contract violation
	}

	err := database.UpsertFinding(ctx, db, evt)
	if err != nil {
		log.Warn().Err(err).Msg("failed to upsert finding")
		return "nak"
	}

	log.Info().
		Str("source", evt.Source).
		Str("findingType", evt.FindingType).
		Str("domainKey", evt.DomainKey).
		Str("subject", evt.Subject).
		Msg("received finding event")
	return "ack"
}
