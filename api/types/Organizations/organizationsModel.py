from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from sqlalchemy.types import Integer
from sqlalchemy import Column, String

from ...models import base

from ..Groups.groupsModel import Groups
from ..Domains.domainsModel import Domains
from ..User.userModel import User_affiliations


class Organizations(base):
    __tablename__ = 'organizations'

    id = Column(Integer, primary_key=True)
    organization = Column(String)
    description = Column(String)
    group_id = Column(Integer, ForeignKey('groups.id'))
    group = relationship("Groups", back_populates="organizations", cascade="all, delete")
    domains = relationship("Domains", back_populates="organization", cascade="all, delete")
    users = relationship("User_affiliations", back_populates="user_organization", cascade="all, delete")