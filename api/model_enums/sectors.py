from models import Sectors
from functions.generate_enums import create_enums


SectorEnum = create_enums(Sectors, 'sector')
ZoneEnum = create_enums(Sectors, 'zone')
