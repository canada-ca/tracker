"""empty message

Revision ID: ffa0779887d6
Revises: 0487ebd413ff
Create Date: 2020-02-28 14:56:52.728247

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer


# revision identifiers, used by Alembic.
revision = 'ffa0779887d6'
down_revision = '0487ebd413ff'
branch_labels = None
depends_on = None


def upgrade():
	# track_dmarc-# \d sectors
	#                                     Table "public.sectors"
	#    Column    |       Type        | Collation | Nullable |               Default
	# -------------+-------------------+-----------+----------+-------------------------------------
	#  id          | integer           |           | not null | nextval('sectors_id_seq'::regclass)
	#  sector      | character varying |           |          |
	#  zone        | character varying |           |          |
	#  description | character varying |           |          |

	# Create an ad-hoc table to use for the insert statement.
	sectors_table = table('sectors',
		column('id', Integer),
		column('sector', String),
		column('zone', String),
		column('description', String)
	)

	op.bulk_insert(sectors_table,
		[
			{id: 1, 'sector': 'GC_A', 'zone':'ZO1', 'description':'Arts'},
			{id: 2, 'sector': 'GC_BF', 'zone':'ZO1', 'description':'Banking and Finance'},
			{id: 3, 'sector': 'GC_BSI', 'zone':'ZO1', 'description':'Border Services and Immigration'},
			{id: 4, 'sector': 'GC_GA', 'zone':'ZO1', 'description':'Government Administration'},
			{id: 5, 'sector': 'GC_H', 'zone':'ZO1', 'description':'Health'},
			{id: 6, 'sector': 'GC_IBD', 'zone':'ZO1', 'description':'Industry and Business Development'},
			{id: 7, 'sector': 'GC_IATD', 'zone':'ZO1', 'description':'International Affairs, Trade & Development'},
			{id: 8, 'sector': 'GC_L', 'zone':'ZO1', 'description':'Legal'},
			{id: 9, 'sector': 'GC_NRED', 'zone':'ZO1', 'description':'Natural Resources, Energy & Environment'},
			{id: 10, 'sector': 'GC_SID', 'zone':'ZO1', 'description':'Security, Intelligence and Defense'},
			{id: 11, 'sector': 'GC_T', 'zone':'ZO1', 'description':'Transportation'},
			{id: 12, 'sector': 'GC_SCD', 'zone':'ZO1', 'description':'Social and Cultural Development'},
			{id: 13, 'sector': 'GC_F', 'zone':'ZO1', 'description':'Finance'},
			{id: 14, 'sector': 'CI_PTM', 'zone':'ZO2', 'description':'Government (Provincial/Territorial/Municipal)'},
			{id: 15, 'sector': 'CI_ICT', 'zone':'ZO2', 'description':'Information and Communication Technology'},
			{id: 16, 'sector': 'CI_FIN', 'zone':'ZO2', 'description':'Finance'},
			{id: 17, 'sector': 'CI_UTIL', 'zone':'ZO2', 'description':'Energy and Utilities'},
			{id: 18, 'sector': 'CI_TRANS', 'zone':'ZO2', 'description':'Transportation'},
			{id: 19, 'sector': 'CI_MANUF', 'zone':'ZO2', 'description':'Manufacturing'},
			{id: 20, 'sector': 'CI_HEALTH', 'zone':'ZO2', 'description':'Health'},
			{id: 21, 'sector': 'CI_FOOD', 'zone':'ZO2', 'description':'Food'},
			{id: 22, 'sector': 'CI_WATER', 'zone':'ZO2', 'description':'Water'},
			{id: 23, 'sector': 'CI_SAFETY', 'zone':'ZO2', 'description':'Safety'},
			{id: 24, 'sector': 'CI_OTHER', 'zone':'ZO2', 'description':'Other'},
		]
	)

	# track_dmarc-# \d groups
	#                                     Table "public.groups"
	#    Column    |       Type        | Collation | Nullable |              Default
	# -------------+-------------------+-----------+----------+------------------------------------
	#  id          | integer           |           | not null | nextval('groups_id_seq'::regclass)
	#  s_group     | character varying |           |          |
	#  description | character varying |           |          |
	#  sector_id   | integer           |           |          |


	groups_table = table('groups',
		column('id', Integer),
		column('s_group', String),
		column('sector_id', Integer),
		column('description', String)
	)


    # TODO: so many duplicates!
	op.bulk_insert(groups_table,
		[
			{id: 1, 'sector_id': 1, 's_group':'GC_A', 'description':'Arts'}, # duplicates sector
			{id: 2, 'sector_id': 1, 's_group':'GC_BF', 'description':'Banking and Finance'}, # duplicates sector
			{id: 3, 'sector_id': 1, 's_group':'GC_BSI', 'description':'Border Services and Immigration'}, # duplicates sector
			{id: 4, 'sector_id': 1, 's_group':'GC_GA', 'description':'Government Administration'}, # duplicates sector
			{id: 5, 'sector_id': 1, 's_group':'GC_H', 'description':'Health'}, # duplicates sector
			{id: 6, 'sector_id': 1, 's_group':'GC_IBD', 'description':'Industry and Business Development'}, # duplicates sector
			{id: 7, 'sector_id': 1, 's_group':'GC_IATD', 'description':'International Affairs, Trade & Development'}, # duplicates sector
			{id: 8, 'sector_id': 1, 's_group':'GC_L', 'description':'Legal'}, # duplicates sector
			{id: 9, 'sector_id': 1, 's_group':'GC_NRED', 'description':'Natural Resources, Energy & Environment'}, # duplicates sector
			{id: 10, 'sector_id': 1, 's_group':'GC_SID', 'description':'Security, Intelligence and Defense'}, # duplicates sector
			{id: 11, 'sector_id': 1, 's_group':'GC_T', 'description':'Transportation'}, # duplicates sector
			{id: 12, 'sector_id': 1, 's_group':'GC_SCD', 'description':'Social and Cultural Development'}, # duplicates sector
			{id: 13, 'sector_id': 1, 's_group':'GC_F', 'description':'Government of Canada Future'}, # Not finance???
			{id: 14, 'sector_id': 1, 's_group':'CI_PT', 'description':'Government (Provincial/Territorial)'},
			{id: 15, 'sector_id': 1, 's_group':'CI_PT_BC', 'description':'British Columbia'},
			{id: 16, 'sector_id': 1, 's_group':'CI_PT_AB', 'description':'Alberta'},
			{id: 17, 'sector_id': 1, 's_group':'CI_PT_SK', 'description':'Saskatchewan'},
			{id: 18, 'sector_id': 1, 's_group':'CI_PT_MB', 'description':'Manitoba'},
			{id: 19, 'sector_id': 1, 's_group':'CI_PT_ON', 'description':'Ontario'},
			{id: 20, 'sector_id': 1, 's_group':'CI_PT_QC', 'description':'Quebec'},
			{id: 21, 'sector_id': 1, 's_group':'CI_PT_NB', 'description':'New Brunswick'},
			{id: 22, 'sector_id': 1, 's_group':'CI_PT_NS', 'description':'Nova Scotia'},
			{id: 23, 'sector_id': 1, 's_group':'CI_PT_PEI', 'description':'Prince Edward Island'},
			{id: 24, 'sector_id': 1, 's_group':'CI_PT_NL', 'description':'Newfoundland and Labrador'},
			{id: 25, 'sector_id': 1, 's_group':'CI_PT_YT', 'description':'Yukon'},
			{id: 26, 'sector_id': 1, 's_group':'CI_PT_NU', 'description':'Nunavut'},
			{id: 27, 'sector_id': 1, 's_group':'CI_MUNIC', 'description':'Government (Municipal)'},
			{id: 28, 'sector_id': 1, 's_group':'CI_MUNIC_BC', 'description':'British Columbia Municipal Government'},
			{id: 29, 'sector_id': 1, 's_group':'CI_MUNIC_AB', 'description':'Alberta Municipal Government'},
			{id: 30, 'sector_id': 1, 's_group':'CI_MUNIC_SK', 'description':'Saskatchewan Municipal Government'},
			{id: 31, 'sector_id': 1, 's_group':'CI_MUNIC_MB', 'description':'Manitoba Municipal Government'},
			{id: 32, 'sector_id': 1, 's_group':'CI_MUNIC_ON', 'description':'Ontario Municipal Government'},
			{id: 33, 'sector_id': 1, 's_group':'CI_MUNIC_QC', 'description':'Quebec Municipal Government'},
			{id: 34, 'sector_id': 1, 's_group':'CI_MUNIC_NB', 'description':'New Brunswick Municipal Government'},
			{id: 35, 'sector_id': 1, 's_group':'CI_MUNIC_PEI', 'description':'Prince Edward Island Municipal Government'},
			{id: 36, 'sector_id': 1, 's_group':'CI_MUNIC_NL', 'description':'Newfoundland and Labrador Municipal Government'},
			{id: 37, 'sector_id': 1, 's_group':'CI_MUNIC_YT', 'description':'Yukon Municipal Government'},
			{id: 38, 'sector_id': 1, 's_group':'CI_MUNIC_NU', 'description':'Nunavut Municipal Government'},
			{id: 39, 'sector_id': 1, 's_group':'CI_MUNIC_NT', 'description':'Northwest Territories Municipal Government'},
			{id: 40, 'sector_id': 1, 's_group':'CI_ICT', 'description':'Information and Communication Technology'},
			{id: 41, 'sector_id': 1, 's_group':'CI_FIN', 'description':'Finance'},
			{id: 42, 'sector_id': 1, 's_group':'CI_UTIL', 'description':'Energy and Utilities'},
			{id: 43, 'sector_id': 1, 's_group':'CI_UTIL_ELECT', 'description':'Electric'},
			{id: 44, 'sector_id': 1, 's_group':'CI_UTIL_OIL', 'description':'Oil and Gas'},
			{id: 45, 'sector_id': 1, 's_group':'CI_UTIL_NCLR', 'description':'Nuclear'},
			{id: 46, 'sector_id': 1, 's_group':'CI_UTIL_MINE', 'description':'Mines and Minerals'},
			{id: 47, 'sector_id': 1, 's_group':'CI_TRANS', 'description':'Transportation'},
			{id: 48, 'sector_id': 1, 's_group':'CI_TRANS_AIR', 'description':'Air Transportation'},
			{id: 49, 'sector_id': 1, 's_group':'CI_TRANS_SEA', 'description':'Marine Transportation'},
			{id: 50, 'sector_id': 1, 's_group':'CI_TRANS_RAIL', 'description':'Rail Transportation'},
			{id: 51, 'sector_id': 1, 's_group':'CI_TRANS_ROAD', 'description':'Road Transportation'},
			{id: 52, 'sector_id': 1, 's_group':'CI_MANUF', 'description':'Manufacturing'},
			{id: 53, 'sector_id': 1, 's_group':'CI_HEALTH', 'description':'Health'},
			{id: 54, 'sector_id': 1, 's_group':'CI_FOOD', 'description':'Food'},
			{id: 55, 'sector_id': 1, 's_group':'CI_WATER', 'description':'Water'},
			{id: 56, 'sector_id': 1, 's_group':'CI_SAFETY', 'description':'Safety'},
			{id: 57, 'sector_id': 1, 's_group':'CI_OTHER', 'description':'Other'},
			{id: 58, 'sector_id': 1, 's_group':'CI_SCADA', 'description':'Industrial Control Systems'},
			{id: 59, 'sector_id': 1, 's_group':'CI_CYBER', 'description':'Cyber Security'},
			{id: 60, 'sector_id': 1, 's_group':'CI_EDU', 'description':'Academia'},
			{id: 61, 'sector_id': 1, 's_group':'CI_NCSI', 'description':'Non-Critical'},
			{id: 62, 'sector_id': 1, 's_group':'S1', 'description':'Assess'},
			{id: 63, 'sector_id': 1, 's_group':'S2', 'description':'Deploy'},
			{id: 64, 'sector_id': 1, 's_group':'S3', 'description':'Enforce'},
			{id: 65, 'sector_id': 1, 's_group':'S4', 'description':'Maintain'},
		]
	)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    # XXX: CASCADE nukes organisations here?
    op.execute('truncate table groups CASCADE')
    op.execute('truncate table sectors CASCADE')
    # ### end Alembic commands ###

