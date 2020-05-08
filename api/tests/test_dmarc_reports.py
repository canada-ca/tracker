from pytest import fail
from app import app
from sqlalchemy import exc
from db import db_session
from models import Dmarc_Reports


def test_should_save_without_raising_an_error():
    with app.app_context():
        try:
            report = Dmarc_Reports(
                start_date="2018-10-01 13:07:12",
                end_date="2018-10-01 13:07:12",
                report={},
            )
            db_session.add(report)
            db_session.commit()
        except exc.IntegrityError:
            fail("Saving Dmarc_Reports model instance failed")
