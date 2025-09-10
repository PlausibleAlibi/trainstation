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
        id=item.Id,
        fromSectionId=item.FromSectionId,
        toSectionId=item.ToSectionId,
        connectionType=item.connection_type,
        switchId=item.SwitchId,
        isActive=item.IsActive,
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
        qry = qry.filter(SectionConnection.FromSectionId == fromSectionId)
    if toSectionId is not None:
        qry = qry.filter(SectionConnection.ToSectionId == toSectionId)
    if connectionType is not None:
        qry = qry.filter(SectionConnection.connection_type == connectionType)
    if switchId is not None:
        qry = qry.filter(SectionConnection.SwitchId == switchId)
    if active is not None:
        qry = qry.filter(SectionConnection.IsActive == active)
    
    rows = qry.order_by(SectionConnection.Id.asc()).offset(offset).limit(limit).all()

    if not includeRelations:
        return [
            SectionConnectionRead(
                id=r.Id,
                fromSectionId=r.FromSectionId,
                toSectionId=r.ToSectionId,
                connectionType=r.connection_type,
                switchId=r.SwitchId,
                isActive=r.IsActive,
            ) for r in rows
        ]

    return [
        SectionConnectionWithRelations(
            id=r.Id,
            fromSectionId=r.FromSectionId,
            toSectionId=r.ToSectionId,
            connectionType=r.connection_type,
            switchId=r.SwitchId,
            isActive=r.IsActive,
            fromSection=SectionRead(
                id=r.FromSection.Id,
                name=r.FromSection.Name,
                trackLineId=r.FromSection.track_line_id,
                startPosition=r.FromSection.start_position,
                endPosition=r.FromSection.end_position,
                length=r.FromSection.length,
                isOccupied=r.FromSection.is_occupied,
                isActive=r.FromSection.IsActive,
            ) if r.from_section else None,
            toSection=SectionRead(
                id=r.ToSection.Id,
                name=r.ToSection.Name,
                trackLineId=r.ToSection.track_line_id,
                startPosition=r.ToSection.start_position,
                endPosition=r.ToSection.end_position,
                length=r.ToSection.length,
                isOccupied=r.ToSection.is_occupied,
                isActive=r.ToSection.IsActive,
            ) if r.to_section else None,
            switch=SwitchRead(
                id=r.Switch.Id,
                name=r.Switch.Name,
                accessoryId=r.Switch.accessory_id,
                sectionId=r.Switch.SectionId,
                position=r.Switch.position,
                isActive=r.Switch.IsActive,
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
        id=r.Id,
        fromSectionId=r.FromSectionId,
        toSectionId=r.ToSectionId,
        connectionType=r.connection_type,
        switchId=r.SwitchId,
        isActive=r.IsActive,
        fromSection=SectionRead(
            id=r.FromSection.Id,
            name=r.FromSection.Name,
            trackLineId=r.FromSection.track_line_id,
            startPosition=r.FromSection.start_position,
            endPosition=r.FromSection.end_position,
            length=r.FromSection.length,
            isOccupied=r.FromSection.is_occupied,
            isActive=r.FromSection.IsActive,
        ) if r.from_section else None,
        toSection=SectionRead(
            id=r.ToSection.Id,
            name=r.ToSection.Name,
            trackLineId=r.ToSection.track_line_id,
            startPosition=r.ToSection.start_position,
            endPosition=r.ToSection.end_position,
            length=r.ToSection.length,
            isOccupied=r.ToSection.is_occupied,
            isActive=r.ToSection.IsActive,
        ) if r.to_section else None,
        switch=SwitchRead(
            id=r.Switch.Id,
            name=r.Switch.Name,
            accessoryId=r.Switch.accessory_id,
            sectionId=r.Switch.SectionId,
            position=r.Switch.position,
            isActive=r.Switch.IsActive,
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

    r.FromSectionId = payload.fromSectionId
    r.ToSectionId = payload.toSectionId
    r.connection_type = payload.connectionType
    r.SwitchId = payload.switchId
    r.IsActive = payload.isActive
    db.commit()
    db.refresh(r)
    return SectionConnectionRead(
        id=r.Id,
        fromSectionId=r.FromSectionId,
        toSectionId=r.ToSectionId,
        connectionType=r.connection_type,
        switchId=r.SwitchId,
        isActive=r.IsActive,
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