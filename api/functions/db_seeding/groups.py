from models import Groups


def seed_groups(db, app):
    group = Groups(
        id=1,
        s_group='GC_A',
        description='Arts',
        sector_id=1
    )
    with app.app_context():
        db.session.add(group)
        db.session.commit()

    group = Groups(
        id=2,
        s_group='GC_BF',
        description='Banking and Finance',
        sector_id=2
    )
    with app.app_context():
        db.session.add(group)
        db.session.commit()


def remove_groups(db, app):
    with app.app_context():
        Groups.query.delete()
        db.session.commit()
