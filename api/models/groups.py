from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

from sqlalchemy.types import Integer
from sqlalchemy import Column, String

from models import Base


class Groups(Base):
    __tablename__ = 'groups'
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True)
    s_group = Column(String)
    description = Column(String)
    sector_id = Column(Integer, ForeignKey('sectors.id'))
    organizations = relationship("Organizations", back_populates="group", cascade="all, delete")
    group_sector = relationship("Sectors", back_populates="groups", cascade="all, delete")