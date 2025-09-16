from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from db import SessionLocal
from models import Section, Switch, Accessory, SectionConnection, Category
from schemas import (
    SectionRead,
    AccessoryRead,
    CategoryRead,
    SectionConnectionRead,
)
from pydantic import BaseModel

router = APIRouter(prefix="/track-layout", tags=["track-layout"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Extended schemas for track layout with position data
class TrackLayoutSwitch(BaseModel):
    id: int
    name: Optional[str] = None
    accessoryId: int
    sectionId: int
    position: str = "unknown"
    isActive: bool = True
    # Position fields from Switch model
    positionX: Optional[float] = None
    positionY: Optional[float] = None
    positionZ: Optional[float] = None
    orientation: Optional[float] = None
    kind: Optional[str] = None
    defaultRoute: Optional[str] = None

class TrackLayoutAccessory(BaseModel):
    id: int
    name: str
    categoryId: int
    controlType: str
    address: str
    isActive: bool = True
    timedMs: Optional[int] = None
    sectionId: Optional[int] = None
    # Include category information
    category: Optional[CategoryRead] = None

class TrackLayoutResponse(BaseModel):
    sections: List[SectionRead]
    switches: List[TrackLayoutSwitch]
    accessories: List[TrackLayoutAccessory]
    connections: List[SectionConnectionRead]

@router.get("", response_model=TrackLayoutResponse)
def get_track_layout(
    includeInactive: bool = Query(default=False, description="Include inactive items"),
    db: Session = Depends(get_db)
):
    """
    Get complete track layout data including sections, switches, accessories, and connections.
    This endpoint provides all data needed to render the virtual track layout.
    """
    
    # Base query filter for active items
    active_filter = {} if includeInactive else {"IsActive": True}
    
    # Get sections with position data
    sections_query = db.query(Section)
    if not includeInactive:
        sections_query = sections_query.filter(Section.IsActive == True)
    sections = sections_query.order_by(Section.Name).all()
    
    # Get switches with position data
    switches_query = db.query(Switch)
    if not includeInactive:
        switches_query = switches_query.filter(Switch.IsActive == True)
    switches = switches_query.order_by(Switch.Name).all()
    
    # Get accessories with category data
    accessories_query = db.query(Accessory).join(Category)
    if not includeInactive:
        accessories_query = accessories_query.filter(Accessory.IsActive == True)
    accessories = accessories_query.order_by(Accessory.Name).all()
    
    # Get section connections
    connections_query = db.query(SectionConnection)
    if not includeInactive:
        connections_query = connections_query.filter(SectionConnection.IsActive == True)
    connections = connections_query.all()
    
    # Build response
    return TrackLayoutResponse(
        sections=[
            SectionRead(
                id=s.Id,
                name=s.Name,
                trackLineId=s.TrackLineId,
                length=s.Length,
                positionX=s.PositionX,
                positionY=s.PositionY,
                positionZ=s.PositionZ,
                isActive=s.IsActive,
            ) for s in sections
        ],
        switches=[
            TrackLayoutSwitch(
                id=sw.Id,
                name=sw.Name,
                accessoryId=sw.AccessoryId,
                sectionId=sw.SectionId,
                position=sw.position,
                isActive=sw.IsActive,
                positionX=sw.PositionX,
                positionY=sw.PositionY,
                positionZ=sw.PositionZ,
                orientation=sw.Orientation,
                kind=sw.Kind,
                defaultRoute=sw.DefaultRoute,
            ) for sw in switches
        ],
        accessories=[
            TrackLayoutAccessory(
                id=a.Id,
                name=a.Name,
                categoryId=a.CategoryId,
                controlType=a.ControlType,
                address=a.Address,
                isActive=a.IsActive,
                timedMs=a.TimedMs,
                sectionId=a.SectionId,
                category=CategoryRead(
                    id=a.Category.Id,
                    name=a.Category.Name,
                    description=a.Category.Description,
                    sortOrder=a.Category.SortOrder,
                ) if a.Category else None,
            ) for a in accessories
        ],
        connections=[
            SectionConnectionRead(
                id=c.Id,
                fromSectionId=c.FromSectionId,
                toSectionId=c.ToSectionId,
                connectionType=c.connection_type,
                switchId=c.SwitchId,
                isActive=c.IsActive,
            ) for c in connections
        ]
    )