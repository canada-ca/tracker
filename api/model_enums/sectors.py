import graphene


class SectorEnums(graphene.Enum):
	GC_A = 'GC_A'
	GC_BF = 'GC_BF'
	GC_BSI = 'GC_BSI'
	GC_GA = 'GC_GA'
	GC_H = 'GC_H'
	GC_IBD = 'GC_IBD'
	GC_IATD = 'GC_IATD'
	GC_L = 'GC_L'
	GC_NRED = 'GC_NRED'
	GC_SID = 'GC_SID'
	GC_T = 'GC_T'
	GC_SCD = 'GC_SCD'
	GC_F = 'GC_F'
	CI_PTM = 'CI_PTM'
	CI_ICT = 'CI_ICT'
	CI_FIN = 'CI_FIN'
	CI_UTIL = 'CI_UTIL'
	CI_TRANS = 'CI_TRANS'
	CI_MANUF = 'CI_MANUF'
	CI_HEALTH = 'CI_HEALTH'
	CI_FOOD = 'CI_FOOD'
	CI_WATER = 'CI_WATER'
	CI_SAFETY = 'CI_SAFETY'
	CI_OTHER = 'CI_OTHER'
	TEST_DEV = 'TEST_DEV'

	@property
	def description(self):
		if self == SectorEnums.GC_A: return 'Arts'
		elif self == SectorEnums.GC_BF: return 'Banking and Finance'
		elif self == SectorEnums.GC_BSI: return 'Border Services and Immigration'
		elif self == SectorEnums.GC_GA: return 'Government Administration'
		elif self == SectorEnums.GC_H: return 'Health'
		elif self == SectorEnums.GC_IBD: return 'Industry and Business Development'
		elif self == SectorEnums.GC.IATD: return 'International Affairs Trade & Development'
		elif self == SectorEnums.GC_L: return 'Legal'
		elif self == SectorEnums.GC_NRED: return 'Natural Resources Energy & Environment'
		elif self == SectorEnums.GC_SID: return 'Security Intelligence and Defence'
		elif self == SectorEnums.GC_T: return 'Transportation'
		elif self == SectorEnums.GC_SCD: return 'Social and Cultural Development'
		elif self == SectorEnums.GC_F: return 'Future Government of Canada'
		elif self == SectorEnums.CI_PTM: return 'Government (Provincial/Territorial/Municipal)'
		elif self == SectorEnums.CI_ICT: return 'Information and Communication Technology'
		elif self == SectorEnums.CI_FIN: return 'Finance'
		elif self == SectorEnums.CI_UTIL: return 'Energy and Utilities'
		elif self == SectorEnums.CI_TRANS: return 'Transportation'
		elif self == SectorEnums.CI_MANUF: return 'Manufacturing'
		elif self == SectorEnums.CI_HEALTH: return 'Health'
		elif self == SectorEnums.CI_FOOD: return 'Food'
		elif self == SectorEnums.CI_WATER: return 'Water'
		elif self == SectorEnums.CI_SAFETY: return 'Safety'
		elif self == SectorEnums.CI_OTHER: return 'Other'
		else: return 'Development test cases'


class ZoneEnums(graphene.Enum):
	GC = 'GC'
	CI = 'CI'
	TEST = 'TEST'

	@property
	def description(self):
		if self == ZoneEnums.GC: return 'Government of Canada'
		elif self == ZoneEnums.CI: return 'Critical Infrastructure'
		else: return 'Development Test Case'
