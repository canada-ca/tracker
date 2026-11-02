import json
import os
import threading
import uuid
from dataclasses import dataclass, replace
from urllib.parse import parse_qs, unquote, urlsplit
from http.server import BaseHTTPRequestHandler, HTTPServer

import pytest
from arango import ArangoClient

from config import Config
from hackerone import HackerOneSettings
from notify import NotifySettings


def make_h1_asset(identifier: str | None, asset_id: str | None = None) -> dict:
    """Build a minimal HackerOne asset dict as returned by the API."""
    return {"id": asset_id or f"asset-{identifier}", "attributes": {"identifier": identifier}}


def make_tag_page(server, tag_id: str, name: str) -> None:
    """Make `server` serve one GC Org ID asset tag on page 1 and an empty page 2."""
    tag = {
        "id": tag_id,
        "attributes": {"name": name},
        "relationships": {"asset_tag_category": {"data": {"attributes": {"name": "GC Org ID"}}}},
    }
    server.respond("GET", "page[number]=1", 200, {"data": [tag]})
    server.respond("GET", "page[number]=2", 200, {"data": []})


def make_domain(domain: str, cvd_status: str | None = None) -> dict:
    """Build a minimal domain dict as returned from ArangoDB."""
    d = {"_id": f"domains/{domain}", "domain": domain}
    if cvd_status is not None:
        d["cvdEnrollment"] = {"status": cvd_status}
    return d


@dataclass(frozen=True)
class ReceivedRequest:
    """One request as seen by FakeHttpServer, with decoded path, query and headers."""

    method: str
    path: str
    query: dict[str, list[str]]
    body: dict | None
    authorization: str | None
    headers: dict[str, str]


class FakeHttpServer:
    """In-process HTTP server standing in for an external API.

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


class FakeH1Server(FakeHttpServer):
    """FakeHttpServer standing in for the HackerOne API."""

    @property
    def settings(self) -> HackerOneSettings:
        """Settings that point the hackerone module at this server."""
        return HackerOneSettings(
            org_id="org",
            program_id="prog",
            username="user",
            token="token",
            base_url=f"{self.url}/v1",
        )


# Well-formed GC Notify key: <name>-<36 char service id>-<36 char secret>.
FAKE_NOTIFY_API_KEY = (
    "fake-key-00000000-0000-0000-0000-000000000001-00000000-0000-0000-0000-000000000002"
)
NOTIFY_TEMPLATE_ID = "template-1"
NOTIFY_EMAIL_PATH = "/v2/notifications/email"


class FakeNotifyServer(FakeHttpServer):
    """FakeHttpServer standing in for GC Notify; accepts email sends by default."""

    def __init__(self) -> None:
        super().__init__()
        self.respond("POST", NOTIFY_EMAIL_PATH, 201, {"id": "notification-1"})

    @property
    def settings(self) -> NotifySettings:
        """Settings that point the notify module at this server."""
        return NotifySettings(
            api_key=FAKE_NOTIFY_API_KEY, base_url=self.url, template_id=NOTIFY_TEMPLATE_ID
        )

    def sent_emails(self) -> list[dict | None]:
        """Return request bodies of every email send received."""
        return self.calls("POST", NOTIFY_EMAIL_PATH)


def make_config(
    h1_server: FakeH1Server, notify_server: FakeNotifyServer, service_account_email: str = "ops@example.ca"
) -> Config:
    """Build a Config whose HackerOne and GC Notify settings point at the fakes."""
    return replace(
        Config.from_env({"SERVICE_ACCOUNT_EMAIL": service_account_email}),
        hackerone=h1_server.settings,
        notify=notify_server.settings,
    )


@pytest.fixture
def h1_server():
    """A running FakeH1Server."""
    server = FakeH1Server()
    server.start()
    yield server
    server.stop()


@pytest.fixture
def notify_server():
    """A running FakeNotifyServer."""
    server = FakeNotifyServer()
    server.start()
    yield server
    server.stop()


@pytest.fixture
def arango_db():
    """A throwaway ArangoDB database with the collections the service queries.

    Skips when TEST_ARANGO_URL is unset; drops the database afterwards.
    """
    url = os.getenv("TEST_ARANGO_URL")
    if not url:
        pytest.skip("TEST_ARANGO_URL not set")
    client = ArangoClient(hosts=url)
    user, password = os.getenv("TEST_ARANGO_USER", "root"), os.getenv("TEST_ARANGO_PASS", "")
    sys_db = client.db("_system", username=user, password=password)
    name = f"cvd_test_{uuid.uuid4().hex[:8]}"
    sys_db.create_database(name)
    db = client.db(name, username=user, password=password)
    db.create_collection("domains")
    db.create_collection("organizations")
    db.create_collection("ownership", edge=True)
    yield db
    sys_db.delete_database(name)
