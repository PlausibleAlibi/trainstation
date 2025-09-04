import enum
from typing import Optional, Literal
from pydantic import BaseModel


# ---------- Enums ----------
class ControlType(str, enum.Enum):
    onOff = "onOff"
    toggle = "toggle"
    timed = "timed"

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

# ---------- Actions / Requests ----------
class TimedRequest(BaseModel):
    milliseconds: int = 5000  # default for timed actions

class ApplyRequest(TimedRequest):
    # Only meaningful for controlType == onOff
    state: Optional[Literal["on", "off"]] = None
