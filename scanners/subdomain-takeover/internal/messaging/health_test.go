package messaging

import "testing"

func TestCheckConnection(t *testing.T) {
	err := CheckConnection(nil)
	if err == nil {
		t.Fatal("expected error for nil connection")
	}
	if err.Error() != "nats connection is nil" {
		t.Fatalf("unexpected error: %v", err)
	}
}
