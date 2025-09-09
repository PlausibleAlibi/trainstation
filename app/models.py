# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float
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
    switches = relationship("Switch", back_populates="accessory", lazy="selectin")

class TrackLine(Base):
    __tablename__ = "track_lines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    length = Column(Float, nullable=True)  # in scale feet/meters
    is_active = Column(Boolean, nullable=False, default=True)

    sections = relationship("Section", back_populates="track_line", lazy="selectin")

class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    track_line_id = Column(Integer, ForeignKey("track_lines.id"), nullable=False)
    start_position = Column(Float, nullable=True)
    end_position = Column(Float, nullable=True)
    length = Column(Float, nullable=True)
    is_occupied = Column(Boolean, nullable=False, default=False)
    is_active = Column(Boolean, nullable=False, default=True)

    track_line = relationship("TrackLine", back_populates="sections", lazy="joined")
    switches = relationship("Switch", back_populates="section", lazy="selectin")
    from_connections = relationship("SectionConnection", foreign_keys="SectionConnection.from_section_id", back_populates="from_section", lazy="selectin")
    to_connections = relationship("SectionConnection", foreign_keys="SectionConnection.to_section_id", back_populates="to_section", lazy="selectin")

class Switch(Base):
    __tablename__ = "switches"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    accessory_id = Column(Integer, ForeignKey("accessories.id"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    position = Column(String(20), nullable=False, default="unknown")  # "straight" | "divergent" | "unknown"
    is_active = Column(Boolean, nullable=False, default=True)

    accessory = relationship("Accessory", back_populates="switches", lazy="joined")
    section = relationship("Section", back_populates="switches", lazy="joined")
    section_connections = relationship("SectionConnection", back_populates="switch", lazy="selectin")

class SectionConnection(Base):
    __tablename__ = "section_connections"
    id = Column(Integer, primary_key=True, index=True)
    from_section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    to_section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    connection_type = Column(String(20), nullable=False, default="direct")  # "direct" | "switch" | "junction"
    switch_id = Column(Integer, ForeignKey("switches.id"), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    from_section = relationship("Section", foreign_keys=[from_section_id], back_populates="from_connections", lazy="joined")
    to_section = relationship("Section", foreign_keys=[to_section_id], back_populates="to_connections", lazy="joined")
    switch = relationship("Switch", back_populates="section_connections", lazy="joined")