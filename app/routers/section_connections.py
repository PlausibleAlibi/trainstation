from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import SessionLocal
from models import SectionConnection, Section, Switch
from schemas import (
    SectionConnectionCreate,
    SectionConnectionRead,
    SectionConnectionWithRelations,
    SectionRead,
    SwitchRead,
)

router = APIRouter(prefix="/sectionConnections", tags=["sectionConnections"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=SectionConnectionRead)
def create_section_connection(payload: SectionConnectionCreate, db: Session = Depends(get_db)):
    # Validate from section exists
    from_section = db.get(Section, payload.fromSectionId)
    if not from_section:
        raise HTTPException(status_code=400, detail="fromSectionId does not exist")

    # Validate to section exists
    to_section = db.get(Section, payload.toSectionId)
    if not to_section:
        raise HTTPException(status_code=400, detail="toSectionId does not exist")

    # Validate switch if provided
    if payload.switchId:
        switch = db.get(Switch, payload.switchId)
        if not switch:
            raise HTTPException(status_code=400, detail="switchId does not exist")

    # Prevent self-connection
    if payload.fromSectionId == payload.toSectionId:
        raise HTTPException(status_code=400, detail="Cannot connect section to itself")

    item = SectionConnection(
        from_section_id=payload.fromSectionId,
        to_section_id=payload.toSectionId,
        connection_type=payload.connectionType,
        switch_id=payload.switchId,
        is_active=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return SectionConnectionRead(
        id=item.id,
        fromSectionId=item.from_section_id,
        toSectionId=item.to_section_id,
        connectionType=item.connection_type,
        switchId=item.switch_id,
        isActive=item.is_active,
    )

# -------- List (with filters & optional embedded relations) --------
@router.get("", response_model=list[SectionConnectionRead] | list[SectionConnectionWithRelations])
def list_section_connections(
    includeRelations: bool = Query(default=False),
    fromSectionId: Optional[int] = Query(default=None),
    toSectionId: Optional[int] = Query(default=None),
    connectionType: Optional[str] = Query(default=None),
    switchId: Optional[int] = Query(default=None),
    active: Optional[bool] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(SectionConnection)
    if fromSectionId is not None:
        qry = qry.filter(SectionConnection.from_section_id == fromSectionId)
    if toSectionId is not None:
        qry = qry.filter(SectionConnection.to_section_id == toSectionId)
    if connectionType is not None:
        qry = qry.filter(SectionConnection.connection_type == connectionType)
    if switchId is not None:
        qry = qry.filter(SectionConnection.switch_id == switchId)
    if active is not None:
        qry = qry.filter(SectionConnection.is_active == active)
    
    rows = qry.order_by(SectionConnection.id.asc()).offset(offset).limit(limit).all()

    if not includeRelations:
        return [
            SectionConnectionRead(
                id=r.id,
                fromSectionId=r.from_section_id,
                toSectionId=r.to_section_id,
                connectionType=r.connection_type,
                switchId=r.switch_id,
                isActive=r.is_active,
            ) for r in rows
        ]

    return [
        SectionConnectionWithRelations(
            id=r.id,
            fromSectionId=r.from_section_id,
            toSectionId=r.to_section_id,
            connectionType=r.connection_type,
            switchId=r.switch_id,
            isActive=r.is_active,
            fromSection=SectionRead(
                id=r.from_section.id,
                name=r.from_section.name,
                trackLineId=r.from_section.track_line_id,
                startPosition=r.from_section.start_position,
                endPosition=r.from_section.end_position,
                length=r.from_section.length,
                isOccupied=r.from_section.is_occupied,
                isActive=r.from_section.is_active,
            ) if r.from_section else None,
            toSection=SectionRead(
                id=r.to_section.id,
                name=r.to_section.name,
                trackLineId=r.to_section.track_line_id,
                startPosition=r.to_section.start_position,
                endPosition=r.to_section.end_position,
                length=r.to_section.length,
                isOccupied=r.to_section.is_occupied,
                isActive=r.to_section.is_active,
            ) if r.to_section else None,
            switch=SwitchRead(
                id=r.switch.id,
                name=r.switch.name,
                accessoryId=r.switch.accessory_id,
                sectionId=r.switch.section_id,
                position=r.switch.position,
                isActive=r.switch.is_active,
            ) if r.switch else None,
        ) for r in rows
    ]

# -------- Read by id (with relations) --------
@router.get("/{id}", response_model=SectionConnectionWithRelations)
def get_section_connection(id: int, db: Session = Depends(get_db)):
    r = db.get(SectionConnection, id)
    if not r:
        raise HTTPException(404, "Section connection not found")
    
    return SectionConnectionWithRelations(
        id=r.id,
        fromSectionId=r.from_section_id,
        toSectionId=r.to_section_id,
        connectionType=r.connection_type,
        switchId=r.switch_id,
        isActive=r.is_active,
        fromSection=SectionRead(
            id=r.from_section.id,
            name=r.from_section.name,
            trackLineId=r.from_section.track_line_id,
            startPosition=r.from_section.start_position,
            endPosition=r.from_section.end_position,
            length=r.from_section.length,
            isOccupied=r.from_section.is_occupied,
            isActive=r.from_section.is_active,
        ) if r.from_section else None,
        toSection=SectionRead(
            id=r.to_section.id,
            name=r.to_section.name,
            trackLineId=r.to_section.track_line_id,
            startPosition=r.to_section.start_position,
            endPosition=r.to_section.end_position,
            length=r.to_section.length,
            isOccupied=r.to_section.is_occupied,
            isActive=r.to_section.is_active,
        ) if r.to_section else None,
        switch=SwitchRead(
            id=r.switch.id,
            name=r.switch.name,
            accessoryId=r.switch.accessory_id,
            sectionId=r.switch.section_id,
            position=r.switch.position,
            isActive=r.switch.is_active,
        ) if r.switch else None,
    )

# -------- Update --------
@router.put("/{id}", response_model=SectionConnectionRead)
def update_section_connection(
    id: int,
    payload: SectionConnectionCreate,
    db: Session = Depends(get_db),
):
    r = db.get(SectionConnection, id)
    if not r:
        raise HTTPException(404, "Section connection not found")

    # Validate from section exists
    from_section = db.get(Section, payload.fromSectionId)
    if not from_section:
        raise HTTPException(400, "fromSectionId does not exist")

    # Validate to section exists
    to_section = db.get(Section, payload.toSectionId)
    if not to_section:
        raise HTTPException(400, "toSectionId does not exist")

    # Validate switch if provided
    if payload.switchId:
        switch = db.get(Switch, payload.switchId)
        if not switch:
            raise HTTPException(400, "switchId does not exist")

    # Prevent self-connection
    if payload.fromSectionId == payload.toSectionId:
        raise HTTPException(400, "Cannot connect section to itself")

    r.from_section_id = payload.fromSectionId
    r.to_section_id = payload.toSectionId
    r.connection_type = payload.connectionType
    r.switch_id = payload.switchId
    r.is_active = payload.isActive
    db.commit()
    db.refresh(r)
    return SectionConnectionRead(
        id=r.id,
        fromSectionId=r.from_section_id,
        toSectionId=r.to_section_id,
        connectionType=r.connection_type,
        switchId=r.switch_id,
        isActive=r.is_active,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_section_connection(id: int, db: Session = Depends(get_db)):
    r = db.get(SectionConnection, id)
    if not r:
        raise HTTPException(404, "Section connection not found")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}