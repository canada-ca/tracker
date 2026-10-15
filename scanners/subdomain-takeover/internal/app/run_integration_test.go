//go:build integration

package app_test

import (
	"context"
	"encoding/json"
	"net"
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
	// NXDOMAIN mode and the target rcode is NXDOMAIN, so the real classifier deterministically emits one
	// finding without needing an HTTP body fetch.
	scan := model.Input{
		DomainKey: "integration-test",
		Results: model.ScanResults{
			Domain:           strPtrForTest("dangling.example.ca"),
			CnameRecord:      strPtrForTest("dangling.example.ca. 300 IN CNAME foo.azurewebsites.net."),
			CnameTargetRcode: strPtrForTest("NXDOMAIN"),
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

// startRestartableNATS boots a JetStream server on a fixed port with a
// persistent StoreDir, and returns a restart func that shuts it down and
// starts a fresh server with identical options, so clients see a genuine
// disconnect followed by a reconnect to the same URL with the stream and
// consumer state intact.
func startRestartableNATS(t *testing.T) (url string, restart func(downtime time.Duration)) {
	t.Helper()

	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to reserve port: %v", err)
	}
	port := l.Addr().(*net.TCPAddr).Port
	l.Close()

	storeDir := t.TempDir()
	start := func() *server.Server {
		t.Helper()
		ns, err := server.NewServer(&server.Options{
			Host:      "127.0.0.1",
			Port:      port,
			JetStream: true,
			StoreDir:  storeDir,
			NoLog:     true,
			NoSigs:    true,
		})
		if err != nil {
			t.Fatalf("failed to create test nats server: %v", err)
		}
		ns.Start()
		if !ns.ReadyForConnections(5 * time.Second) {
			t.Fatal("test nats server did not become ready")
		}
		return ns
	}

	current := start()
	t.Cleanup(func() { current.Shutdown() })

	restart = func(downtime time.Duration) {
		t.Helper()
		current.Shutdown()
		current.WaitForShutdown()
		time.Sleep(downtime)
		current = start()
	}
	return current.ClientURL(), restart
}

// testHarness wires the real runtime deps and worker against a stream created
// on url, with a core subscription observing published findings.
type testHarness struct {
	cfg      *config.Config
	deps     *bootstrap.RuntimeDeps
	worker   *app.Worker
	findings chan *nats.Msg
	setupNC  *nats.Conn
}

func newTestHarness(t *testing.T, url string) *testHarness {
	t.Helper()

	if err := fingerprints.Load(zerolog.Nop()); err != nil {
		t.Fatalf("failed to load fingerprints: %v", err)
	}
	logger := zerolog.Nop()
	cfg := &config.Config{
		NATSURL:     url,
		NATSStream:  "SUBDOMAIN_TAKEOVER_TEST",
		SubjectIn:   "scans.dns_scanner_results.test",
		SubjectOut:  "scans.findings.subdomain-takeover.test",
		DurableName: "subdomain_takeover_test",
		WorkerCount: 2,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	setupNC, err := nats.Connect(url, nats.MaxReconnects(-1), nats.ReconnectWait(50*time.Millisecond))
	if err != nil {
		t.Fatalf("failed to connect for setup: %v", err)
	}
	t.Cleanup(setupNC.Close)

	js, err := jetstream.New(setupNC)
	if err != nil {
		t.Fatalf("failed to create jetstream client: %v", err)
	}
	if _, err := js.CreateStream(ctx, jetstream.StreamConfig{
		Name:     cfg.NATSStream,
		Subjects: []string{cfg.SubjectIn, cfg.SubjectOut},
	}); err != nil {
		t.Fatalf("failed to create stream: %v", err)
	}

	deps, err := bootstrap.NewRuntimeDeps(ctx, cfg, logger)
	if err != nil {
		t.Fatalf("failed to build runtime deps: %v", err)
	}
	t.Cleanup(deps.NC.Close)

	findings := make(chan *nats.Msg, 1)
	sub, err := setupNC.Subscribe(cfg.SubjectOut, func(msg *nats.Msg) {
		select {
		case findings <- msg:
		default:
		}
	})
	if err != nil {
		t.Fatalf("failed to subscribe to output subject: %v", err)
	}
	t.Cleanup(func() { _ = sub.Unsubscribe() })

	publisher := messaging.NewPublisher(logger, deps.JS, cfg.SubjectOut)
	worker := app.NewWorker(logger, publisher, detect.NewClassifier(nil, logger))

	return &testHarness{cfg: cfg, deps: deps, worker: worker, findings: findings, setupNC: setupNC}
}

// run starts app.Run in a goroutine and returns a channel closed when it exits.
func (h *testHarness) run(ctx context.Context) <-chan struct{} {
	done := make(chan struct{})
	go func() {
		defer close(done)
		app.Run(ctx, app.RunnerDeps{
			Logger:      zerolog.Nop(),
			WorkerCount: h.cfg.WorkerCount,
			Iter:        h.deps.Iter,
			Worker:      h.worker,
			NC:          h.deps.NC,
		})
	}()
	return done
}

// danglingCNAMEPayload matches the Azure NXDOMAIN fingerprint, so the
// classifier deterministically emits one finding without an HTTP fetch.
func danglingCNAMEPayload(t *testing.T) []byte {
	t.Helper()
	payload, err := json.Marshal(model.Input{
		DomainKey: "integration-test",
		Results: model.ScanResults{
			Domain:           strPtrForTest("dangling.example.ca"),
			CnameRecord:      strPtrForTest("dangling.example.ca. 300 IN CNAME foo.azurewebsites.net."),
			CnameTargetRcode: strPtrForTest("NXDOMAIN"),
		},
	})
	if err != nil {
		t.Fatalf("failed to marshal scan input: %v", err)
	}
	return payload
}

// TestIntegration_Run_SurvivesNATSReconnect is a regression test for the
// runner exiting on a transient NATS disconnect: CheckConnection treated a
// reconnecting connection as fatal, and the connection had no reconnect
// options. See the PR #7582 review comment on internal/bootstrap/nats.go:22.
//
// This verifies end-to-end recovery (reconnect, consumer resumes, finding
// published). It does not by itself fail against the old health check,
// because iter.Next() blocks across the outage and Run never re-checks
// health while disconnected; the health-check half of the regression is
// pinned by TestIntegration_CheckConnection/reconnecting in messaging.
func TestIntegration_Run_SurvivesNATSReconnect(t *testing.T) {
	url, restart := startRestartableNATS(t)
	h := newTestHarness(t, url)

	runCtx, cancelRun := context.WithCancel(context.Background())
	t.Cleanup(cancelRun)
	runDone := h.run(runCtx)

	// Outlast the iterator's 1s pull expiry so its pull requests expire
	// during the outage and must be reissued after reconnect.
	restart(3 * time.Second)

	select {
	case <-runDone:
		t.Fatal("Run exited after a transient NATS disconnect")
	default:
	}

	waitForReconnect(t, h.deps.NC)
	waitForReconnect(t, h.setupNC)

	js, err := jetstream.New(h.setupNC)
	if err != nil {
		t.Fatalf("failed to create jetstream client: %v", err)
	}
	pubCtx, cancelPub := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelPub()
	if _, err := js.Publish(pubCtx, h.cfg.SubjectIn, danglingCNAMEPayload(t)); err != nil {
		t.Fatalf("failed to publish scan input after restart: %v", err)
	}

	select {
	case msg := <-h.findings:
		var event model.FindingEvent
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			t.Fatalf("finding event payload not valid json: %v", err)
		}
		if event.FindingType != string(model.FindingTypeSubdomainTakeoverCNAME) {
			t.Fatalf("unexpected finding type: %q", event.FindingType)
		}
	case <-runDone:
		t.Fatal("Run exited before processing the post-reconnect message")
	case <-time.After(15 * time.Second):
		t.Fatal("timed out waiting for finding after reconnect")
	}

	h.deps.Iter.Drain()
	cancelRun()
	select {
	case <-runDone:
	case <-time.After(10 * time.Second):
		t.Fatal("Run did not stop after context cancellation")
	}
}

// TestIntegration_Run_ShutdownDrainsAndClosesConnection mirrors main.go's
// shutdown sequence: cancel, drain the iterator, wait for Run, then drain the
// connection and observe the Closed signal.
func TestIntegration_Run_ShutdownDrainsAndClosesConnection(t *testing.T) {
	h := newTestHarness(t, startTestNATS(t))

	runCtx, cancelRun := context.WithCancel(context.Background())
	t.Cleanup(cancelRun)
	runDone := h.run(runCtx)

	cancelRun()
	h.deps.Iter.Drain()

	select {
	case <-runDone:
	case <-time.After(10 * time.Second):
		t.Fatal("Run did not stop after cancellation and iterator drain")
	}

	if err := h.deps.NC.Drain(); err != nil {
		t.Fatalf("connection drain failed: %v", err)
	}
	select {
	case <-h.deps.Closed:
	case <-time.After(10 * time.Second):
		t.Fatal("connection did not signal closed after drain")
	}
	if !h.deps.NC.IsClosed() {
		t.Fatal("expected connection to be closed")
	}
}

func waitForReconnect(t *testing.T, nc *nats.Conn) {
	t.Helper()
	deadline := time.Now().Add(10 * time.Second)
	for !nc.IsConnected() {
		if time.Now().After(deadline) {
			t.Fatalf("connection did not reconnect (status=%s)", nc.Status())
		}
		time.Sleep(20 * time.Millisecond)
	}
}

func strPtrForTest(v string) *string { return &v }
