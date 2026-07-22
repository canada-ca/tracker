package detect

import (
	"io"
	"testing"

	"github.com/rs/zerolog"
)

func TestSetLogger(t *testing.T) {
	SetLogger(zerolog.New(io.Discard))
	if got := detectLogger.GetLevel(); got == zerolog.Disabled {
		t.Fatalf("expected configured logger, got level=%s", got)
	}
}
