from models import Groups


def seed_groups(db):
	group = Groups(
		id=1,
		s_group='GC_A',
		description='Arts',
		sector_id=1
	)
	db.session.add(group)
	db.session.commit()

	group = Groups(
		id=2,
		s_group='GC_BF',
		description='Banking and Finance',
		sector_id=2
	)
	db.session.add(group)
	db.session.commit()


def remove_groups(db):
	Groups.query.filter(Groups.id == 1).delete()
	db.session.commit()

	Groups.query.filter(Groups.id == 2).delete()
	db.session.commit()
