# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from db import Base  # <-- absolute import

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(String(255), nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)

    accessories = relationship("Accessory", back_populates="category", lazy="selectin")

class Accessory(Base):
    __tablename__ = "accessories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    control_type = Column(String(20), nullable=False)  # "onOff" | "toggle" | "timed"
    address = Column(String(50), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    timed_ms = Column(Integer, nullable=True)

    category = relationship("Category", back_populates="accessories", lazy="joined")