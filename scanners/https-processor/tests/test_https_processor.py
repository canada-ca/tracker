import asyncio
import json
import pytest
import datetime
from os import environ
from operator import itemgetter
from dotenv import load_dotenv
from nats.aio.client import Msg
from pretend import call_recorder, call
from aioarangodb import ArangoClient, DatabaseCreateError, CollectionCreateError
from pretend import stub
from https_processor import subscribe_handler, process_https, save_to_arangodb
from test_data import *

load_dotenv(".test.env")

host, username, password, dbname = itemgetter(
    "DB_URL", "DB_USER", "DB_PASS", "DB_NAME"
)(environ)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def scanresults():
    return {
        "results": {
            "implementation": "Valid HTTPS",
            "enforced": "Strict",
            "hsts": "HSTS Fully Implemented",
            "hsts_age": 31536000,
            "preload_status": "HSTS Not Preloaded",
            "expired_cert": False,
            "self_signed_cert": False,
            "cert_revocation_status": "Valid",
            "cert_bad_hostname": False,
        },
        "scan_type": "https",
        "user_key": None,
        "domain_key": "8017518",
        "shared_id": None,
    }


@pytest.fixture
async def msg(scanresults):
    msg = Msg(
        subject="domains.8017518.https",
        reply="",
        data=json.dumps(scanresults).encode(),
        sid=0,
    )
    return msg


@pytest.fixture
async def db(scope="session"):
    client = ArangoClient(hosts=host)
    # sys = await client.db("_system", username=username, password=password)
    db = await client.db(dbname, username=username, password=password)
    yield db
    await client.close()


@pytest.fixture
async def https(db):
    try:
        https = await db.create_collection("https")
    except CollectionCreateError:
        https = db.collection("https")
    yield https
    await https.truncate()


@pytest.fixture
async def domains(db):
    try:
        domains = await db.create_collection("domains")
    except CollectionCreateError:
        domains = db.collection("domains")
    yield domains
    await domains.truncate()


@pytest.fixture
async def domainshttps(db):
    try:
        domains_https = await db.create_collection("domainsHTTPS")
    except CollectionCreateError:
        domains_https = db.collection("domainsHTTPS")
    yield domains_https
    await domains.truncate()


@pytest.mark.asyncio
async def test_subscribe_handler_calls_processing_function(
    domains, https, domainshttps
):
    process = call_recorder(lambda r, d, u, s, t: None)
    await subscribe_handler(msg, process, timestamp)
    assert len(process.calls) == 1


@pytest.mark.asyncio
async def test_subscribe_handler_calls_processing_function(msg):
    process = call_recorder(lambda r, d, u, s, t: None)
    timestamp = str(datetime.datetime.utcnow())
    await subscribe_handler(msg, process, timestamp)
    assert len(process.calls) == 1
    assert process.calls == [
        call(
            {
                "implementation": "Valid HTTPS",
                "enforced": "Strict",
                "hsts": "HSTS Fully Implemented",
                "hsts_age": 31536000,
                "preload_status": "HSTS Not Preloaded",
                "expired_cert": False,
                "self_signed_cert": False,
                "cert_revocation_status": "Valid",
                "cert_bad_hostname": False,
            },
            "8017518",
            None,
            None,
            timestamp,
        )
    ]


@pytest.mark.asyncio
async def test_process_https_saves_to_db_when_user_key_is_none(scanresults):
    async def save(r, t, u):
            return call_recorder(lambda r, t, u: None)
    publish = call_recorder(lambda r, t, u: None)
    timestamp = str(datetime.datetime.utcnow())
    process_https(
        scanresults["results"],
        scanresults["domain_key"],
        None,
        None,
        timestamp,
        save,
        publish,
    )
    # not a one-time-scan so shouldn't publish to redis
    assert len(publish.calls) == 0
    assert len(save.calls) == 1
    assert save.calls == [
        call(
            {
                "sharedId": None,
                "domainKey": "8017518",
                "status": "pass",
                "results": {
                    "timestamp": timestamp,
                    "implementation": "Valid HTTPS",
                    "enforced": "Strict",
                    "hsts": "HSTS Fully Implemented",
                    "hstsAge": 31536000,
                    "preloaded": "HSTS Not Preloaded",
                    "rawJson": {
                        "implementation": "Valid HTTPS",
                        "enforced": "Strict",
                        "hsts": "HSTS Fully Implemented",
                        "hsts_age": 31536000,
                        "preload_status": "HSTS Not Preloaded",
                        "expired_cert": False,
                        "self_signed_cert": False,
                        "cert_revocation_status": "Valid",
                        "cert_bad_hostname": False,
                    },
                    "neutralTags": ["https12"],
                    "positiveTags": [],
                    "negativeTags": [],
                },
            },
            "https",  # domain_key
            None,  # user_key
        )
    ]


@pytest.mark.asyncio
async def test_some_asyncio_code(db, https, domains):
    # Arrange
    domain = await domains.insert(
        {
            "domain": "cyber.gc.ca",
            "selectors": ["selector1"],
            "status": {
                "dkim": "pass",
                "dmarc": "pass",
                "https": "pass",
                "spf": "pass",
                "ssl": "pass",
            },
            "phase": "",
        }
    )
    timestamp = str(datetime.datetime.utcnow())

    # Act
    await save_to_arangodb(
        {
            "sharedId": None,
            "domainKey": "8017518",
            "status": "pass",
            "results": {
                "timestamp": timestamp,
                "implementation": "Valid HTTPS",
                "enforced": "Strict",
                "hsts": "HSTS Fully Implemented",
                "hstsAge": 31536000,
                "preloaded": "HSTS Not Preloaded",
                "rawJson": {
                    "implementation": "Valid HTTPS",
                    "enforced": "Strict",
                    "hsts": "HSTS Fully Implemented",
                    "hsts_age": 31536000,
                    "preload_status": "HSTS Not Preloaded",
                    "expired_cert": False,
                    "self_signed_cert": False,
                    "cert_revocation_status": "Valid",
                    "cert_bad_hostname": False,
                },
                "neutralTags": ["https12"],
                "positiveTags": [],
                "negativeTags": [],
            },
        },
        "https", # scan_type
        None, # user_key
    )

    cursor = await db.aql.execute("FOR result IN https RETURN result")
    result_count = await cursor.count()
    assert result_count == 1
    await cursor.close(ignore_missing=True)
