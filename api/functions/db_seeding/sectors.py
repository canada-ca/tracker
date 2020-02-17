from models import Sectors


def seed_sectors(db):
	sector = Sectors(
		id=1,
		zone="GC",
		sector="GC_A",
		description="Arts"
	)
	db.session.add(sector)
	db.session.commit()

	sector = Sectors(
		id=2,
		zone="GC",
		sector="GC_BF",
		description="Banking and Finance"
	)
	db.session.add(sector)
	db.session.commit()

	sector = Sectors(
		id=25,
		zone="TEST",
		sector="TEST_DEV",
		description="Development test cases"
	)
	db.session.add(sector)
	db.session.commit()


def remove_sectors(db):
	Sectors.query.filter(Sectors.id == 1).delete()
	db.session.commit()

	Sectors.query.filter(Sectors.id == 2).delete()
	db.session.commit()

	Sectors.query.filter(Sectors.id == 25).delete()
	db.session.commit()
