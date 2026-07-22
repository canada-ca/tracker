package detect

import "github.com/rs/zerolog"

var detectLogger = zerolog.Nop()

func SetLogger(logger zerolog.Logger) {
	detectLogger = logger.With().Str("component", "detect").Logger()
}
