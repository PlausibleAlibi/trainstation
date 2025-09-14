# app/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from db import Base

class Category(Base):
    __tablename__ = "Categories"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(50), nullable=False, unique=True, index=True)
    Description = Column(String(255), nullable=True)
    SortOrder = Column(Integer, nullable=False, default=0)

    Accessories = relationship("Accessory", back_populates="Category", lazy="selectin")

class Accessory(Base):
    __tablename__ = "Accessories"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False, index=True)
    CategoryId = Column(Integer, ForeignKey("Categories.Id"), nullable=False)
    ControlType = Column(String(20), nullable=False)  # "onOff" | "toggle" | "timed"
    Address = Column(String(50), nullable=False)
    IsActive = Column(Boolean, nullable=False, default=True)
    TimedMs = Column(Integer, nullable=True)
    SectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=True, index=True)

    Category = relationship("Category", back_populates="Accessories", lazy="joined")
    Section = relationship("Section", back_populates="Accessories", lazy="joined")


class TrackLine(Base):
    __tablename__ = "TrackLines"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False, unique=True, index=True)
    Description = Column(String(255), nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)

    Sections = relationship("Section", back_populates="TrackLine", lazy="selectin")


class Section(Base):
    __tablename__ = "Sections"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False)
    TrackLineId = Column(Integer, ForeignKey("TrackLines.Id"), nullable=False, index=True)
    Length = Column(Float, nullable=True)
    PositionX = Column(Float, nullable=True)
    PositionY = Column(Float, nullable=True)
    PositionZ = Column(Float, nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)

    TrackLine = relationship("TrackLine", back_populates="Sections", lazy="joined")
    Accessories = relationship("Accessory", back_populates="Section", lazy="selectin")
    Switches = relationship("Switch", back_populates="Section", lazy="selectin")
    OutgoingConnections = relationship("SectionConnection", foreign_keys="SectionConnection.FromSectionId", back_populates="FromSection", lazy="selectin")
    IncomingConnections = relationship("SectionConnection", foreign_keys="SectionConnection.ToSectionId", back_populates="ToSection", lazy="selectin")


class Switch(Base):
    __tablename__ = "Switches"
    Id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=True, index=True)
    AccessoryId = Column(Integer, ForeignKey("Accessories.Id"), nullable=False, index=True)
    SectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    Kind = Column(String(50), nullable=False)  # Type of switch (turnout, crossover, etc.)
    DefaultRoute = Column(String(50), nullable=True)  # Default routing state
    Orientation = Column(Float, nullable=True)  # Orientation angle in degrees
    PositionX = Column(Float, nullable=True)
    PositionY = Column(Float, nullable=True)
    PositionZ = Column(Float, nullable=True)
    position = Column(String(50), nullable=False, default="unknown")  # Switch position: straight, divergent, unknown
    IsActive = Column(Boolean, default=True, nullable=False)

    Accessory = relationship("Accessory", lazy="joined")
    Section = relationship("Section", back_populates="Switches", lazy="joined")
    Connections = relationship("SectionConnection", back_populates="Switch", lazy="selectin")


class SectionConnection(Base):
    __tablename__ = "SectionConnections"
    Id = Column(Integer, primary_key=True, index=True)
    FromSectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    ToSectionId = Column(Integer, ForeignKey("Sections.Id"), nullable=False, index=True)
    SwitchId = Column(Integer, ForeignKey("Switches.Id"), nullable=True, index=True)
    RouteInfo = Column(String(255), nullable=True)  # Routing information
    IsBidirectional = Column(Boolean, nullable=False, default=True)
    connection_type = Column(String(50), nullable=False, default="direct")  # Connection type: direct, switch, junction
    IsActive = Column(Boolean, nullable=False, default=True)  # Active status

    FromSection = relationship("Section", foreign_keys=[FromSectionId], back_populates="OutgoingConnections", lazy="joined")
    ToSection = relationship("Section", foreign_keys=[ToSectionId], back_populates="IncomingConnections", lazy="joined")
    Switch = relationship("Switch", back_populates="Connections", lazy="joined")


class TrainAsset(Base):
    __tablename__ = "TrainAssets"
    Id = Column(Integer, primary_key=True, index=True)
    AssetId = Column(String(100), nullable=True, index=True)  # optional, client-readable
    RfidTagId = Column(String(100), nullable=False, unique=True, index=True)  # RFID tag UID
    Type = Column(String(50), nullable=False)  # enum/string: Engine, Car, Caboose, etc.
    RoadNumber = Column(String(100), nullable=False, index=True)  # railroad asset number
    Description = Column(String(255), nullable=True)  # optional info
    Active = Column(Boolean, nullable=False, default=True)
    DateAdded = Column(DateTime, nullable=False, default=datetime.utcnow)

    LocationEvents = relationship("AssetLocationEvent", back_populates="Asset", lazy="selectin")


class AssetLocationEvent(Base):
    __tablename__ = "AssetLocationEvents"
    EventId = Column(Integer, primary_key=True, index=True)
    AssetId = Column(Integer, ForeignKey("TrainAssets.Id"), nullable=False, index=True)  # FK to TrainAsset
    RfidTagId = Column(String(100), nullable=False, index=True)  # tag detected
    Location = Column(String(100), nullable=False)  # reader/zone name
    ReaderId = Column(String(100), nullable=False, index=True)
    Timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    Asset = relationship("TrainAsset", back_populates="LocationEvents", lazy="joined")
