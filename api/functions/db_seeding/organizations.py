from models import Organizations


def seed_org(db, app):
    org = Organizations(
        id=1,
        organization='ORG1',
        org_tags={
            "description": 'Organization 1'
        }
    )
    with app.app_context():
        db.session.add(org)

    org = Organizations(
        id=2,
        organization='ORG2',
        org_tags={
            "description": 'Organization 2'
        }
    )
    with app.app_context():
        db.session.add(org)

    org = Organizations(
        id=3,
        organization='ORG3',
        org_tags={
            "description": 'Organization 3'
        }
    )
    with app.app_context():
        db.session.add(org)
        db.session.commit()

def remove_org(db, app):
    with app.app_context():
        Organizations.query.delete()
        db.session.commit()
