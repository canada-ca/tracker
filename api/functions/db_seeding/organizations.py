from models import Organizations


def seed_org(db, app):
    org = Organizations(
        id=1,
        organization='ORG1',
        description='Organization 1',
        group_id=1
    )
    with app.app_context():
        db.session.add(org)
        db.session.commit()

    org = Organizations(
        id=2,
        organization='ORG2',
        description='Organization 2',
        group_id=2
    )
    with app.app_context():
        db.session.add(org)
        db.session.commit()


def remove_org(db, app):
    with app.app_context():
        Organizations.query.delete()
        db.session.commit()
