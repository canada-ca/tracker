from models import Organizations


def seed_org(db):
	org = Organizations(
		id=1,
		organization='Arts',
		description='Arts',
		group_id=1
	)
	db.session.add(org)
	db.session.commit()

	org = Organizations(
		id=6,
		organization='BOC',
		description='BOC - Bank of Canada',
		group_id=2
	)
	db.session.add(org)
	db.session.commit()


def remove_org(db):
	Organizations.query.filter(Organizations.id == 1).delete()
	db.session.commit()

	Organizations.query.filter(Organizations.id == 6).delete()
	db.session.commit()
