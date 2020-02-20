from models import Domains


def seed_domains(db, app):
    domain = Domains(
        id=15,
        domain='bankofcanada.ca',
        organization_id=6
    )
    with app.app_context():
        db.session.add(domain)
        db.session.commit()


def remove_domains(db, app):
    with app.app_context():
        Domains.query.delete()
        db.session.commit()
