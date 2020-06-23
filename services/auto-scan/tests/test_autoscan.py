import pytest
import databases
from autoscan import *
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from pretend import stub
from autoscan import Service, Domains, Users

TEST_DATABASE_URI = "postgresql://track_dmarc:postgres@testdb/track_dmarc"
engine = create_engine(TEST_DATABASE_URI)


def test_retrieval():

    input_domains = [{"domain": "cyber.gc.ca"},
                     {"domain": "canada.ca"},
                     {"domain": "forces.gc.ca"}]

    session = sessionmaker(bind=engine, autocommit=True)
    test_session = session()

    with test_session.begin():
        test_session.execute(Users.insert().values(user_name="system", user_password="sysuserpass", display_name="system", preferred_lang="English"))

        for domain in input_domains:
            test_session.execute(Domains.insert().values(domain=domain["domain"]))
            test_session.execute(Domains.insert().values(domain=domain["domain"]))
            test_session.execute(Domains.insert().values(domain=domain["domain"]))

    client_stub = stub(post=lambda url, headers: None)

    response = Service(database=databases.Database(TEST_DATABASE_URI), client=client_stub)

    assert all(domain["domain"] in response["Dispatched"] for domain in input_domains)
