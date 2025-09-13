from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import SessionLocal
from models import Switch, Accessory, Section
from schemas import (
    SwitchCreate,
    SwitchRead,
    SwitchWithRelations,
    AccessoryRead,
    SectionRead,
)

router = APIRouter(prefix="/switches", tags=["switches"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=SwitchRead)
def create_switch(payload: SwitchCreate, db: Session = Depends(get_db)):
    # Validate accessory exists
    accessory = db.get(Accessory, payload.accessoryId)
    if not accessory:
        raise HTTPException(status_code=400, detail="accessoryId does not exist")

    # Validate section exists
    section = db.get(Section, payload.sectionId)
    if not section:
        raise HTTPException(status_code=400, detail="sectionId does not exist")

    item = Switch(
        Name=payload.name,
        AccessoryId=payload.accessoryId,
        SectionId=payload.sectionId,
        Kind=payload.kind,
        DefaultRoute=payload.defaultRoute,
        Orientation=payload.orientation,
        PositionX=payload.positionX,
        PositionY=payload.positionY,
        PositionZ=payload.positionZ,
        position=payload.position,
        IsActive=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return SwitchRead(
        id=item.Id,
        name=item.Name,
        accessoryId=item.AccessoryId,
        sectionId=item.SectionId,
        kind=item.Kind,
        defaultRoute=item.DefaultRoute,
        orientation=item.Orientation,
        positionX=item.PositionX,
        positionY=item.PositionY,
        positionZ=item.PositionZ,
        position=item.position,
        isActive=item.IsActive,
    )

# -------- List (with filters & optional embedded relations) --------
@router.get("", response_model=list[SwitchRead] | list[SwitchWithRelations])
def list_switches(
    includeRelations: bool = Query(default=False),
    sectionId: Optional[int] = Query(default=None),
    accessoryId: Optional[int] = Query(default=None),
    position: Optional[str] = Query(default=None),
    active: Optional[bool] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in name"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(Switch)
    if sectionId is not None:
        qry = qry.filter(Switch.SectionId == sectionId)
    if accessoryId is not None:
        qry = qry.filter(Switch.AccessoryId == accessoryId)
    if position is not None:
        qry = qry.filter(Switch.position == position)
    if active is not None:
        qry = qry.filter(Switch.IsActive == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(Switch.Name.ilike(like))
    
    rows = qry.order_by(Switch.Name.asc()).offset(offset).limit(limit).all()

    if not includeRelations:
        return [
            SwitchRead(
                id=r.Id,
                name=r.Name,
                accessoryId=r.AccessoryId,
                sectionId=r.SectionId,
                kind=r.Kind,
                defaultRoute=r.DefaultRoute,
                orientation=r.Orientation,
                positionX=r.PositionX,
                positionY=r.PositionY,
                positionZ=r.PositionZ,
                position=r.position,
                isActive=r.IsActive,
            ) for r in rows
        ]

    return [
        SwitchWithRelations(
            id=r.Id,
            name=r.Name,
            accessoryId=r.AccessoryId,
            sectionId=r.SectionId,
            kind=r.Kind,
            defaultRoute=r.DefaultRoute,
            orientation=r.Orientation,
            positionX=r.PositionX,
            positionY=r.PositionY,
            positionZ=r.PositionZ,
            position=r.position,
            isActive=r.IsActive,
            accessory=AccessoryRead(
                id=r.Accessory.Id,
                name=r.Accessory.Name,
                categoryId=r.Accessory.CategoryId,
                controlType=r.Accessory.ControlType,
                address=r.Accessory.Address,
                isActive=r.Accessory.IsActive,
                timedMs=r.Accessory.TimedMs,
            ) if r.Accessory else None,
            section=SectionRead(
                id=r.Section.Id,
                name=r.Section.Name,
                trackLineId=r.Section.TrackLineId,
                isActive=r.Section.IsActive,
            ) if r.Section else None,
        ) for r in rows
    ]

# -------- Read by id (with relations) --------
@router.get("/{id}", response_model=SwitchWithRelations)
def get_switch(id: int, db: Session = Depends(get_db)):
    r = db.get(Switch, id)
    if not r:
        raise HTTPException(404, "Switch not found")
    
    return SwitchWithRelations(
        id=r.Id,
        name=r.Name,
        accessoryId=r.AccessoryId,
        sectionId=r.SectionId,
        kind=r.Kind,
        defaultRoute=r.DefaultRoute,
        orientation=r.Orientation,
        positionX=r.PositionX,
        positionY=r.PositionY,
        positionZ=r.PositionZ,
        position=r.position,
        isActive=r.IsActive,
        accessory=AccessoryRead(
            id=r.Accessory.Id,
            name=r.Accessory.Name,
            categoryId=r.Accessory.CategoryId,
            controlType=r.Accessory.ControlType,
            address=r.Accessory.Address,
            isActive=r.Accessory.IsActive,
            timedMs=r.Accessory.TimedMs,
        ) if r.Accessory else None,
        section=SectionRead(
            id=r.Section.Id,
            name=r.Section.Name,
            trackLineId=r.Section.TrackLineId,
            isActive=r.Section.IsActive,
        ) if r.Section else None,
    )

# -------- Update --------
@router.put("/{id}", response_model=SwitchRead)
def update_switch(
    id: int,
    payload: SwitchCreate,
    db: Session = Depends(get_db),
):
    r = db.get(Switch, id)
    if not r:
        raise HTTPException(404, "Switch not found")

    # Validate accessory exists
    accessory = db.get(Accessory, payload.accessoryId)
    if not accessory:
        raise HTTPException(400, "accessoryId does not exist")

    # Validate section exists
    section = db.get(Section, payload.sectionId)
    if not section:
        raise HTTPException(400, "sectionId does not exist")

    r.Name = payload.name
    r.AccessoryId = payload.accessoryId
    r.SectionId = payload.sectionId
    r.Kind = payload.kind
    r.DefaultRoute = payload.defaultRoute
    r.Orientation = payload.orientation
    r.PositionX = payload.positionX
    r.PositionY = payload.positionY
    r.PositionZ = payload.positionZ
    r.position = payload.position
    r.IsActive = payload.isActive
    db.commit()
    db.refresh(r)
    return SwitchRead(
        id=r.Id,
        name=r.Name,
        accessoryId=r.AccessoryId,
        sectionId=r.SectionId,
        kind=r.Kind,
        defaultRoute=r.DefaultRoute,
        orientation=r.Orientation,
        positionX=r.PositionX,
        positionY=r.PositionY,
        positionZ=r.PositionZ,
        position=r.position,
        isActive=r.IsActive,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_switch(id: int, db: Session = Depends(get_db)):
    r = db.get(Switch, id)
    if not r:
        raise HTTPException(404, "Switch not found")
    
    # Check if there are section connections using this switch
    from models import SectionConnection
    if db.query(SectionConnection).filter(SectionConnection.SwitchId == id).first():
        raise HTTPException(400, "Switch is used in section connections; remove them first")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}