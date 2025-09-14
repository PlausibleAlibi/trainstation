from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import SessionLocal
from models import Section, TrackLine
from schemas import (
    SectionCreate,
    SectionRead,
    SectionWithTrackLine,
    SectionWithRelations,
    TrackLineRead,
)

router = APIRouter(prefix="/sections", tags=["sections"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=SectionRead)
def create_section(payload: SectionCreate, db: Session = Depends(get_db)):
    # Validate track line exists
    track_line = db.get(TrackLine, payload.trackLineId)
    if not track_line:
        raise HTTPException(status_code=400, detail="trackLineId does not exist")

    item = Section(
        Name=payload.name,
        TrackLineId=payload.trackLineId,
        IsActive=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return SectionRead(
        id=item.Id,
        name=item.Name,
        trackLineId=item.TrackLineId,
        startPosition=item.start_position,
        endPosition=item.end_position,
        length=item.length,
        isOccupied=item.is_occupied,
        isActive=item.IsActive,
    )

# -------- List (with filters & optional embedded track line) --------
@router.get("", response_model=list[SectionRead] | list[SectionWithTrackLine])
def list_sections(
    includeTrackLine: bool = Query(default=False),
    trackLineId: Optional[int] = Query(default=None),
    occupied: Optional[bool] = Query(default=None),
    active: Optional[bool] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in name"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(Section)
    if trackLineId is not None:
        qry = qry.filter(Section.TrackLineId == trackLineId)
    if occupied is not None:
        qry = qry.filter(Section.is_occupied == occupied)
    if active is not None:
        qry = qry.filter(Section.IsActive == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(Section.Name.ilike(like))
    
    rows = qry.order_by(Section.Name.asc()).offset(offset).limit(limit).all()

    if not includeTrackLine:
        return [
            SectionRead(
                id=r.Id,
                name=r.Name,
                trackLineId=r.TrackLineId,
                positionX=r.PositionX,
                positionY=r.PositionY,
                positionZ=r.PositionZ,
                isActive=r.IsActive,
            ) for r in rows
        ]

    return [
        SectionWithTrackLine(
            id=r.Id,
            name=r.Name,
            trackLineId=r.TrackLineId,
            positionX=r.PositionX,
            positionY=r.PositionY,
            positionZ=r.PositionZ,
            isActive=r.IsActive,
            trackLine=TrackLineRead(
                id=r.TrackLine.Id,
                name=r.TrackLine.Name,
                description=getattr(r.TrackLine, 'Description', None),
                length=getattr(r.TrackLine, 'Length', None),
                isActive=r.TrackLine.IsActive,
            ) if getattr(r, 'TrackLine', None) else None,
        ) for r in rows
    ]

# -------- Read by id (with track line and switches) --------
@router.get("/{id}", response_model=SectionWithRelations)
def get_section(id: int, db: Session = Depends(get_db)):
    r = db.get(Section, id)
    if not r:
        raise HTTPException(404, "Section not found")
    
    from schemas import SwitchRead
    return SectionWithRelations(
        id=r.Id,
        name=r.Name,
        trackLineId=r.TrackLineId,
        startPosition=r.start_position,
        endPosition=r.end_position,
        length=r.length,
        isOccupied=r.is_occupied,
        isActive=r.IsActive,
        trackLine=TrackLineRead(
            id=r.TrackLine.Id,
            name=r.TrackLine.Name,
            description=r.TrackLine.Description,
            isActive=r.TrackLine.IsActive,
        ) if r.TrackLine else None,
        switches=[
            SwitchRead(
                id=s.Id,
                name=s.Name,
                accessoryId=s.AccessoryId,
                sectionId=s.SectionId,
                position=s.position,
                isActive=s.IsActive,
            ) for s in r.switches
        ]
    )

# -------- Update --------
@router.put("/{id}", response_model=SectionRead)
def update_section(
    id: int,
    payload: SectionCreate,
    db: Session = Depends(get_db),
):
    r = db.get(Section, id)
    if not r:
        raise HTTPException(404, "Section not found")

    # Validate track line exists
    track_line = db.get(TrackLine, payload.trackLineId)
    if not track_line:
        raise HTTPException(400, "trackLineId does not exist")

    r.Name = payload.Name
    r.TrackLineId = payload.trackLineId
    r.start_position = payload.startPosition
    r.end_position = payload.endPosition
    r.length = payload.length
    r.is_occupied = payload.isOccupied
    r.IsActive = payload.isActive
    db.commit()
    db.refresh(r)
    return SectionRead(
        id=r.Id,
        name=r.Name,
        trackLineId=r.TrackLineId,
        startPosition=r.start_position,
        endPosition=r.end_position,
        length=r.length,
        isOccupied=r.is_occupied,
        isActive=r.IsActive,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_section(id: int, db: Session = Depends(get_db)):
    r = db.get(Section, id)
    if not r:
        raise HTTPException(404, "Section not found")
    
    # Check if there are switches or connections using this section
    from models import Switch, SectionConnection
    if db.query(Switch).filter(Switch.SectionId == id).first():
        raise HTTPException(400, "Section has switches; reassign or delete them first")
    
    if (db.query(SectionConnection)
        .filter((SectionConnection.FromSectionId == id) | 
                (SectionConnection.ToSectionId == id))
        .first()):
        raise HTTPException(400, "Section has connections; delete them first")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}