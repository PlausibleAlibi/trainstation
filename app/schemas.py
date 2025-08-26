from enum import Enum
from pydantic import BaseModel

# ---------- Enums ----------
class ControlType(str, Enum):
    onOff = "onOff"
    toggle = "toggle"
    timed = "timed"

# ---------- Category ----------
class CategoryBase(BaseModel):
    name: str
    description: str | None = None
    sortOrder: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2: map ORM -> schema

# ---------- Accessory ----------
class AccessoryBase(BaseModel):
    name: str
    categoryId: int
    controlType: ControlType
    address: str
    isActive: bool = True

class AccessoryCreate(AccessoryBase):
    pass

class AccessoryRead(AccessoryBase):
    id: int

    class Config:
        from_attributes = True

# Accessory with embedded Category (for includeCategory=true)
class AccessoryWithCategory(AccessoryRead):
    category: CategoryRead | None = None