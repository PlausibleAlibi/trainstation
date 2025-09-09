import enum
from typing import Optional, Literal
from pydantic import BaseModel


# ---------- Enums ----------
class ControlType(str, enum.Enum):
    onOff = "onOff"
    toggle = "toggle"
    timed = "timed"

class SwitchPosition(str, enum.Enum):
    straight = "straight"
    divergent = "divergent"
    unknown = "unknown"

class ConnectionType(str, enum.Enum):
    direct = "direct"
    switch = "switch"
    junction = "junction"

# ---------- Categories ----------
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sortOrder: int = 0


class CategoryCount(BaseModel):
    categoryId: int
    count: int

class CategoryRead(CategoryCreate):
    id: int

# ---------- Accessories ----------


class AccessoryUpdate(BaseModel):
    name: Optional[str] = None
    categoryId: Optional[int] = None
    controlType: Optional[str] = None
    address: Optional[str] = None
    isActive: Optional[bool] = None
    timedMs: Optional[int] = None

class AccessoryCreate(BaseModel):
    name: str
    categoryId: int
    controlType: Literal["onOff","toggle","timed"]
    address: str
    isActive: bool = True
    timedMs: int | None = None

class AccessoryRead(AccessoryCreate):
    id: int

class AccessoryWithCategory(AccessoryRead):
    category: Optional[CategoryRead] = None

# ---------- Track Lines ----------
class TrackLineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    length: Optional[float] = None
    isActive: bool = True

class TrackLineRead(TrackLineCreate):
    id: int

class TrackLineWithSections(TrackLineRead):
    sections: list['SectionRead'] = []

# ---------- Sections ----------
class SectionCreate(BaseModel):
    name: str
    trackLineId: int
    startPosition: Optional[float] = None
    endPosition: Optional[float] = None
    length: Optional[float] = None
    isOccupied: bool = False
    isActive: bool = True

class SectionRead(SectionCreate):
    id: int

class SectionWithTrackLine(SectionRead):
    trackLine: Optional[TrackLineRead] = None

class SectionWithRelations(SectionWithTrackLine):
    switches: list['SwitchRead'] = []

# ---------- Switches ----------
class SwitchCreate(BaseModel):
    name: str
    accessoryId: int
    sectionId: int
    position: Literal["straight", "divergent", "unknown"] = "unknown"
    isActive: bool = True

class SwitchRead(SwitchCreate):
    id: int

class SwitchWithRelations(SwitchRead):
    accessory: Optional[AccessoryRead] = None
    section: Optional[SectionRead] = None

# ---------- Section Connections ----------
class SectionConnectionCreate(BaseModel):
    fromSectionId: int
    toSectionId: int
    connectionType: Literal["direct", "switch", "junction"] = "direct"
    switchId: Optional[int] = None
    isActive: bool = True

class SectionConnectionRead(SectionConnectionCreate):
    id: int

class SectionConnectionWithRelations(SectionConnectionRead):
    fromSection: Optional[SectionRead] = None
    toSection: Optional[SectionRead] = None
    switch: Optional[SwitchRead] = None

# ---------- Actions / Requests ----------
class TimedRequest(BaseModel):
    milliseconds: int = 5000  # default for timed actions

class ApplyRequest(TimedRequest):
    # Only meaningful for controlType == onOff
    state: Optional[Literal["on", "off"]] = None
