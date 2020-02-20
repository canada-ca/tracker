from models import Sectors


def seed_sectors(db, app):
    sector = Sectors(
        id=1,
        zone="ZO1",
        sector="SEC1",
        description="Sector 1"
    )
    with app.app_context():
        db.session.add(sector)
        db.session.commit()

    sector = Sectors(
        id=2,
        zone="ZO2",
        sector="SEC2",
        description="Sector 2"
    )
    with app.app_context():
        db.session.add(sector)
        db.session.commit()

    sector = Sectors(
        id=25,
        zone="TEST",
        sector="TEST_DEV",
        description="Development test cases"
    )
    with app.app_context():
        db.session.add(sector)
        db.session.commit()


def remove_sectors(db, app):
    with app.app_context():
        Sectors.query.delete()
        db.session.commit()
