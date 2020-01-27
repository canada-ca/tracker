import graphene
from graphene import relay
from graphene_sqlalchemy import SQLAlchemyObjectType, SQLAlchemyConnectionField

from models.scans import Scans as ScanModel
from models.scans import Dmarc_scans as DmarcModel
from models.scans import Dkim_scans as DkimModel
from models.scans import Spf_scans as SpfModel
from models.scans import Https_scans as HttpModel
from models.scans import Ssl_scans as SSLModel


class Scans(SQLAlchemyObjectType):
	class Meta:
		model = ScanModel
		interfaces = (relay.Node, )


class ScansConnection(relay.Connection):
	class Meta:
		node = Scans


class Dmarc(SQLAlchemyObjectType):
	class Meta:
		model = DmarcModel
		interfaces = (relay.Node, )


class DmarcConnection(relay.Connection):
	class Meta:
		node = Dmarc


class Dkim(SQLAlchemyObjectType):
	class Meta:
		model = DkimModel
		interfaces = (relay.Node, )


class DkimConnection(relay.Connection):
	class Meta:
		node = Dkim


class Spf(SQLAlchemyObjectType):
	class Meta:
		model = SpfModel
		interfaces = (relay.Node, )


class SpfConnection(relay.Connection):
	class Meta:
		node = Spf


class HTTP(SQLAlchemyObjectType):
	class Meta:
		model = HttpModel
		interfaces = (relay.Node, )


class HttpConnection(relay.Connection):
	class Meta:
		node = HTTP


class SSL(SQLAlchemyObjectType):
	class Meta:
		model = SSLModel
		interfaces = (relay.Node, )


class SSLConnection(relay.Connection):
	class Meta:
		node = SSL