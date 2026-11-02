import json
import threading
from dataclasses import dataclass
from urllib.parse import parse_qs, unquote, urlsplit
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest

import hackerone


def make_h1_asset(identifier: str | None, asset_id: str | None = None) -> dict:
    """Build a minimal HackerOne asset dict as returned by the API."""
    return {"id": asset_id or f"asset-{identifier}", "attributes": {"identifier": identifier}}


def make_domain(domain: str, cvd_status: str | None = None) -> dict:
    """Build a minimal domain dict as returned from ArangoDB."""
    d = {"_id": f"domains/{domain}", "domain": domain}
    if cvd_status is not None:
        d["cvdEnrollment"] = {"status": cvd_status}
    return d


@dataclass(frozen=True)
class ReceivedRequest:
    """One request as seen by FakeH1Server, with decoded path, query and headers."""

    method: str
    path: str
    query: dict[str, list[str]]
    body: dict | None
    authorization: str | None
    headers: dict[str, str]


class FakeH1Server:
    """In-process HTTP server standing in for the HackerOne API.

    Routes are matched on method plus a substring of the request target;
    the most recently added matching route wins. Unmatched requests get 404.
    """

    def __init__(self) -> None:
        self.routes: list[tuple[str, str, int, dict]] = []
        self.requests: list[tuple[str, str, dict | None]] = []
        self.received: list[ReceivedRequest] = []
        server = self

        class Handler(BaseHTTPRequestHandler):
            def _handle(self) -> None:
                length = int(self.headers.get("Content-Length", 0))
                body = json.loads(self.rfile.read(length)) if length else None
                target = unquote(self.path)
                server.requests.append((self.command, target, body))
                split = urlsplit(self.path)
                server.received.append(
                    ReceivedRequest(
                        method=self.command,
                        path=unquote(split.path),
                        query=parse_qs(split.query),
                        body=body,
                        authorization=self.headers.get("Authorization"),
                        headers=dict(self.headers.items()),
                    )
                )
                status, payload = server._lookup(self.command, target)
                raw = payload if isinstance(payload, bytes) else json.dumps(payload).encode()
                self.send_response(status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            do_GET = do_POST = do_PUT = _handle

            def log_message(self, *args) -> None:
                pass

        self._httpd = HTTPServer(("127.0.0.1", 0), Handler)
        self.url = f"http://127.0.0.1:{self._httpd.server_port}"
        self._thread = threading.Thread(target=self._httpd.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)

    def respond(self, method: str, target_contains: str, status: int, body: dict) -> None:
        """Register a route; it takes priority over earlier routes."""
        self.routes.insert(0, (method, target_contains, status, body))

    def respond_raw(self, method: str, target_contains: str, status: int, raw: bytes) -> None:
        """Register a route that replies with raw bytes (e.g. malformed JSON)."""
        self.routes.insert(0, (method, target_contains, status, raw))

    def calls(self, method: str, target_contains: str) -> list[dict | None]:
        """Return request bodies received for matching calls."""
        return [b for m, t, b in self.requests if m == method and target_contains in t]

    def _lookup(self, method: str, target: str) -> tuple[int, dict | bytes]:
        for route_method, contains, status, body in self.routes:
            if route_method == method and contains in target:
                return status, body
        return 404, {"errors": [{"title": "no route"}]}

    def start(self) -> None:
        self._thread.start()

    def stop(self) -> None:
        self._httpd.shutdown()
        self._httpd.server_close()
        self._thread.join()


@pytest.fixture
def h1_server(monkeypatch):
    """A running FakeH1Server with hackerone.py pointed at it."""
    server = FakeH1Server()
    server.start()
    monkeypatch.setattr(hackerone, "BASE_URL", f"{server.url}/v1")
    monkeypatch.setattr(hackerone, "ORG_ASSETS_URL", f"{server.url}/v1/organizations/org/assets")
    monkeypatch.setattr(hackerone, "ORG_ID", "org")
    monkeypatch.setattr(hackerone, "PROGRAM_ID", "prog")
    monkeypatch.setattr(hackerone, "API_USERNAME", "user")
    monkeypatch.setattr(hackerone, "API_TOKEN", "token")
    yield server
    server.stop()
