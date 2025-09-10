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
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True, index=True)

    category = relationship("Category", back_populates="accessories", lazy="joined")
    section = relationship("Section", back_populates="accessories", lazy="joined")


class TrackLine(Base):
    __tablename__ = "trackLines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(String(255), nullable=True)

    sections = relationship("Section", back_populates="track_line", lazy="selectin")


class Section(Base):
    __tablename__ = "sections"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    trackLine_id = Column(Integer, ForeignKey("trackLines.id"), nullable=False, index=True)
    position_x = Column(Float, nullable=True)
    position_y = Column(Float, nullable=True)
    position_z = Column(Float, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    track_line = relationship("TrackLine", back_populates="sections", lazy="joined")
    accessories = relationship("Accessory", back_populates="section", lazy="selectin")
    switches = relationship("Switch", back_populates="section", lazy="selectin")
    outgoing_connections = relationship("SectionConnection", foreign_keys="SectionConnection.from_section_id", back_populates="from_section", lazy="selectin")
    incoming_connections = relationship("SectionConnection", foreign_keys="SectionConnection.to_section_id", back_populates="to_section", lazy="selectin")


class Switch(Base):
    __tablename__ = "switches"
    id = Column(Integer, primary_key=True, index=True)
    accessory_id = Column(Integer, ForeignKey("accessories.id"), nullable=False, index=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    kind = Column(String(50), nullable=False)  # Type of switch (turnout, crossover, etc.)
    default_route = Column(String(50), nullable=True)  # Default routing state
    orientation = Column(Float, nullable=True)  # Orientation angle in degrees
    position_x = Column(Float, nullable=True)
    position_y = Column(Float, nullable=True)
    position_z = Column(Float, nullable=True)

    accessory = relationship("Accessory", lazy="joined")
    section = relationship("Section", back_populates="switches", lazy="joined")
    connections = relationship("SectionConnection", back_populates="switch", lazy="selectin")


class SectionConnection(Base):
    __tablename__ = "sectionConnections"
    id = Column(Integer, primary_key=True, index=True)
    from_section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    to_section_id = Column(Integer, ForeignKey("sections.id"), nullable=False, index=True)
    switch_id = Column(Integer, ForeignKey("switches.id"), nullable=True, index=True)
    route_info = Column(String(255), nullable=True)  # Routing information
    is_bidirectional = Column(Boolean, nullable=False, default=True)

    from_section = relationship("Section", foreign_keys=[from_section_id], back_populates="outgoing_connections", lazy="joined")
    to_section = relationship("Section", foreign_keys=[to_section_id], back_populates="incoming_connections", lazy="joined")
    switch = relationship("Switch", back_populates="connections", lazy="joined")
