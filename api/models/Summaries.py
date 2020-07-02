from sqlalchemy import Column, Integer, Float, String
from db import Base


class Summaries(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True)
    category = Column(String)
    count = Column(Integer)
    percentage = Column(Float)
    type = Column(String)
