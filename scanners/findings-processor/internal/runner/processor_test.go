package runner

import (
	"strings"
	"testing"

	"github.com/canada-ca/tracker/scanners/findings-processor/internal/config"
)

func TestRun_ConnectNATSError(t *testing.T) {
	t.Parallel()

	err := Run(config.Config{NATSURL: "nats://127.0.0.1:1"})
	if err == nil {
		t.Fatal("Run() error = nil, want error connecting to an unreachable NATS URL")
	}
	if !strings.Contains(err.Error(), "failed to connect to NATS") {
		t.Errorf("Run() error = %q, want it to mention the NATS connection failure", err.Error())
	}
}
