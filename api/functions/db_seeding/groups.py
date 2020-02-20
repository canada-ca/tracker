from models import Groups


def seed_groups(db, app):
    group = Groups(
        id=1,
        s_group='GO1',
        description='Group 1',
        sector_id=1
    )
    with app.app_context():
        db.session.add(group)
        db.session.commit()

    group = Groups(
        id=2,
        s_group='GO2',
        description='Group 2',
        sector_id=2
    )
    with app.app_context():
        db.session.add(group)
        db.session.commit()


def remove_groups(db, app):
    with app.app_context():
        Groups.query.delete()
        db.session.commit()
