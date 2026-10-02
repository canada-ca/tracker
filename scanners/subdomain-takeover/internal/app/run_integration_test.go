//go:build integration

package app_test

import (
	"context"
	"encoding/json"
	"testing"
	"time"

	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/app"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/bootstrap"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/config"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/detect"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/fingerprints"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/messaging"
	"github.com/canada-ca/tracker/scanners/subdomain-takeover/internal/model"
	"github.com/nats-io/nats-server/v2/server"
	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
	"github.com/rs/zerolog"
)

// startTestNATS boots a real, in-process NATS server with JetStream enabled
// so Run's connection-health and message-iteration paths can be exercised
// against the genuine client, not a fake -- nats.Conn exposes no way to fake
// a healthy connected state, so this is the only way to reach that code.
func startTestNATS(t *testing.T) string {
	t.Helper()

	opts := &server.Options{
		Host:      "127.0.0.1",
		Port:      -1,
		JetStream: true,
		StoreDir:  t.TempDir(),
		NoLog:     true,
		NoSigs:    true,
	}

	ns, err := server.NewServer(opts)
	if err != nil {
		t.Fatalf("failed to create test nats server: %v", err)
	}

	ns.Start()
	t.Cleanup(ns.Shutdown)

	if !ns.ReadyForConnections(5 * time.Second) {
		t.Fatal("test nats server did not become ready")
	}

	return ns.ClientURL()
}

func TestIntegration_Run_ProcessesMessageEndToEnd(t *testing.T) {
	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}

	url := startTestNATS(t)
	logger := zerolog.Nop()

	cfg := &config.Config{
		NATSURL:     url,
		NATSStream:  "SUBDOMAIN_TAKEOVER_TEST",
		SubjectIn:   "scans.dns_scanner_results.test",
		SubjectOut:  "scans.findings.subdomain-takeover.test",
		DurableName: "subdomain_takeover_test",
		WorkerCount: 2,
	}

	setupCtx, cancelSetup := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelSetup()

	setupConn, err := nats.Connect(cfg.NATSURL)
	if err != nil {
		t.Fatalf("failed to connect for setup: %v", err)
	}
	defer setupConn.Close()

	js, err := jetstream.New(setupConn)
	if err != nil {
		t.Fatalf("failed to create jetstream client: %v", err)
	}
	if _, err := js.CreateStream(setupCtx, jetstream.StreamConfig{
		Name:     cfg.NATSStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	}); err != nil {
		t.Fatalf("failed to create stream: %v", err)
	}

	// bootstrap.NewRuntimeDeps is the same real wiring main.go uses -- reusing
	// it here means the test exercises the actual consumer/iterator setup,
	// not a reimplementation of it.
	runtimeDeps, err := bootstrap.NewRuntimeDeps(setupCtx, cfg, logger)
	if err != nil {
		t.Fatalf("failed to build runtime deps: %v", err)
	}
	defer runtimeDeps.NC.Close()

	// Subscribing on the core subject observes findings the worker publishes,
	// independent of the JetStream storage the assertions below also check.
	findings := make(chan *nats.Msg, 1)
	sub, err := setupConn.Subscribe(cfg.SubjectOut, func(msg *nats.Msg) {
		findings <- msg
	})
	if err != nil {
		t.Fatalf("failed to subscribe to output subject: %v", err)
	}
	defer sub.Unsubscribe()

	publisher := messaging.NewPublisher(logger, runtimeDeps.JS, cfg.SubjectOut)
	classifier := detect.NewClassifier(nil, logger)
	worker := app.NewWorker(logger, publisher, classifier)

	// This input matches the real "Microsoft Azure" CNAME fingerprint's
	// NXDOMAIN mode, so the real classifier deterministically emits one
	// finding without needing an HTTP body fetch.
	scan := model.Input{
		DomainKey: "integration-test",
		Results: model.ScanResults{
			Domain:      strPtrForTest("dangling.example.ca"),
			CnameRecord: strPtrForTest("dangling.example.ca. 300 IN CNAME foo.azurewebsites.net."),
		},
	}
	payload, err := json.Marshal(scan)
	if err != nil {
		t.Fatalf("failed to marshal scan input: %v", err)
	}
	if _, err := js.Publish(setupCtx, cfg.SubjectIn, payload); err != nil {
		t.Fatalf("failed to publish scan input: %v", err)
	}

	runCtx, cancelRun := context.WithCancel(context.Background())
	runDone := make(chan struct{})
	go func() {
		defer close(runDone)
		app.Run(runCtx, app.RunnerDeps{
			Logger:      logger,
			WorkerCount: cfg.WorkerCount,
			Iter:        runtimeDeps.Iter,
			Worker:      worker,
			NC:          runtimeDeps.NC,
		})
	}()

	select {
	case msg := <-findings:
		var event model.FindingEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			t.Fatalf("finding event payload not valid json: %v", err)
		}
		if event.FindingType != string(model.FindingTypeSubdomainTakeoverCNAME) {
			t.Fatalf("unexpected finding type: %q", event.FindingType)
		}
		if event.DomainKey != scan.DomainKey {
			t.Fatalf("unexpected domain key: %q", event.DomainKey)
		}
	case <-time.After(10 * time.Second):
		t.Fatal("timed out waiting for finding to be published")
	}

	// Mirrors main.go's shutdown sequence: stop the iterator so a blocked
	// Next() call returns promptly, then cancel the context.
	runtimeDeps.Iter.Stop()
	cancelRun()
	select {
	case <-runDone:
	case <-time.After(10 * time.Second):
		t.Fatal("Run did not stop after context cancellation")
	}
}

func strPtrForTest(v string) *string { return &v }
