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
        name=payload.name,
        accessory_id=payload.accessoryId,
        section_id=payload.sectionId,
        position=payload.position,
        is_active=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return SwitchRead(
        id=item.id,
        name=item.name,
        accessoryId=item.accessory_id,
        sectionId=item.section_id,
        position=item.position,
        isActive=item.is_active,
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
        qry = qry.filter(Switch.section_id == sectionId)
    if accessoryId is not None:
        qry = qry.filter(Switch.accessory_id == accessoryId)
    if position is not None:
        qry = qry.filter(Switch.position == position)
    if active is not None:
        qry = qry.filter(Switch.is_active == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(Switch.name.ilike(like))
    
    rows = qry.order_by(Switch.name.asc()).offset(offset).limit(limit).all()

    if not includeRelations:
        return [
            SwitchRead(
                id=r.id,
                name=r.name,
                accessoryId=r.accessory_id,
                sectionId=r.section_id,
                position=r.position,
                isActive=r.is_active,
            ) for r in rows
        ]

    return [
        SwitchWithRelations(
            id=r.id,
            name=r.name,
            accessoryId=r.accessory_id,
            sectionId=r.section_id,
            position=r.position,
            isActive=r.is_active,
            accessory=AccessoryRead(
                id=r.accessory.id,
                name=r.accessory.name,
                categoryId=r.accessory.category_id,
                controlType=r.accessory.control_type,
                address=r.accessory.address,
                isActive=r.accessory.is_active,
                timedMs=r.accessory.timed_ms,
            ) if r.accessory else None,
            section=SectionRead(
                id=r.section.id,
                name=r.section.name,
                trackLineId=r.section.track_line_id,
                startPosition=r.section.start_position,
                endPosition=r.section.end_position,
                length=r.section.length,
                isOccupied=r.section.is_occupied,
                isActive=r.section.is_active,
            ) if r.section else None,
        ) for r in rows
    ]

# -------- Read by id (with relations) --------
@router.get("/{id}", response_model=SwitchWithRelations)
def get_switch(id: int, db: Session = Depends(get_db)):
    r = db.get(Switch, id)
    if not r:
        raise HTTPException(404, "Switch not found")
    
    return SwitchWithRelations(
        id=r.id,
        name=r.name,
        accessoryId=r.accessory_id,
        sectionId=r.section_id,
        position=r.position,
        isActive=r.is_active,
        accessory=AccessoryRead(
            id=r.accessory.id,
            name=r.accessory.name,
            categoryId=r.accessory.category_id,
            controlType=r.accessory.control_type,
            address=r.accessory.address,
            isActive=r.accessory.is_active,
            timedMs=r.accessory.timed_ms,
        ) if r.accessory else None,
        section=SectionRead(
            id=r.section.id,
            name=r.section.name,
            trackLineId=r.section.track_line_id,
            startPosition=r.section.start_position,
            endPosition=r.section.end_position,
            length=r.section.length,
            isOccupied=r.section.is_occupied,
            isActive=r.section.is_active,
        ) if r.section else None,
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

    r.name = payload.name
    r.accessory_id = payload.accessoryId
    r.section_id = payload.sectionId
    r.position = payload.position
    r.is_active = payload.isActive
    db.commit()
    db.refresh(r)
    return SwitchRead(
        id=r.id,
        name=r.name,
        accessoryId=r.accessory_id,
        sectionId=r.section_id,
        position=r.position,
        isActive=r.is_active,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_switch(id: int, db: Session = Depends(get_db)):
    r = db.get(Switch, id)
    if not r:
        raise HTTPException(404, "Switch not found")
    
    # Check if there are section connections using this switch
    from models import SectionConnection
    if db.query(SectionConnection).filter(SectionConnection.switch_id == id).first():
        raise HTTPException(400, "Switch is used in section connections; remove them first")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}