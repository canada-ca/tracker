from models import Domains


def seed_domains(db):
	domain = Domains(
		id=15,
		domain='bankofcanada.ca',
		organization_id=6
	)
	db.session.add(domain)
	db.session.commit()


def remove_domains(db):
	Domains.query.filter(Domains.id == 15).delete()
	db.session.commit()
