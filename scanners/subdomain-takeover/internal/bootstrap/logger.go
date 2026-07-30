package bootstrap

import (
	"os"

	"github.com/rs/zerolog"
)

func NewLogger(level zerolog.Level) zerolog.Logger {
	zerolog.SetGlobalLevel(level)
	multi := zerolog.MultiLevelWriter(zerolog.ConsoleWriter{Out: os.Stderr})
	return zerolog.New(multi).With().Timestamp().Logger()
}
