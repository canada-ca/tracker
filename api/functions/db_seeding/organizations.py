from models import Organizations


def seed_org(db, app):
    org = Organizations(
        id=1,
        organization='Arts',
        description='Arts',
        group_id=1
    )
    with app.app_context():
        db.session.add(org)
        db.session.commit()

    org = Organizations(
        id=6,
        organization='BOC',
        description='BOC - Bank of Canada',
        group_id=2
    )
    with app.app_context():
        db.session.add(org)
        db.session.commit()


def remove_org(db, app):
    with app.app_context():
        Organizations.query.delete()
        db.session.commit()
