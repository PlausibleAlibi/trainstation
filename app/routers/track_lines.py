from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db import SessionLocal
from models import TrackLine
from schemas import (
    TrackLineCreate,
    TrackLineRead,
    TrackLineWithSections,
)

router = APIRouter(prefix="/trackLines", tags=["trackLines"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=TrackLineRead)
def create_track_line(payload: TrackLineCreate, db: Session = Depends(get_db)):
    item = TrackLine(
        Name=payload.name,
        Description=payload.description,
        # length field doesn't exist in new schema, removing
        IsActive=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return TrackLineRead(
        id=item.Id,
        name=item.Name,
        description=item.Description,
        isActive=item.IsActive,
    )

# -------- List (with optional sections) --------
@router.get("", response_model=list[TrackLineRead] | list[TrackLineWithSections])
def list_track_lines(
    includeSections: bool = Query(default=False),
    active: Optional[bool] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in name or description"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(TrackLine)
    if active is not None:
        qry = qry.filter(TrackLine.IsActive == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            (TrackLine.Name.ilike(like)) |
            (TrackLine.Description.ilike(like))
        )
    rows = qry.order_by(TrackLine.Name.asc()).offset(offset).limit(limit).all()

    if not includeSections:
        return [
            TrackLineRead(
                id=r.Id,
                name=r.Name,
                description=r.Description,
                isActive=r.IsActive,
            ) for r in rows
        ]

    from schemas import SectionRead
    return [
        TrackLineWithSections(
            id=r.Id,
            name=r.Name,
            description=r.Description,
            isActive=r.IsActive,
            sections=[
                SectionRead(
                    id=s.Id,
                    name=s.Name,
                    trackLineId=s.TrackLineId,
                    # These fields don't exist in new schema, removing
                    # startPosition=s.start_position,
                    # endPosition=s.end_position,
                    # length=s.length,
                    # isOccupied=s.is_occupied,
                    isActive=s.IsActive,
                ) for s in r.Sections
            ]
        ) for r in rows
    ]

# -------- Read by id (with sections) --------
@router.get("/{id}", response_model=TrackLineWithSections)
def get_track_line(id: int, db: Session = Depends(get_db)):
    r = db.get(TrackLine, id)
    if not r:
        raise HTTPException(404, "Track line not found")
    
    from schemas import SectionRead
    return TrackLineWithSections(
        id=r.Id,
        name=r.Name,
        description=r.Description,
        isActive=r.IsActive,
        sections=[
            SectionRead(
                id=s.Id,
                name=s.Name,
                trackLineId=s.TrackLineId,
                # These fields don't exist in new schema, removing
                # startPosition=s.start_position,
                # endPosition=s.end_position,
                # length=s.length,
                # isOccupied=s.is_occupied,
                isActive=s.IsActive,
            ) for s in r.Sections
        ]
    )

# -------- Update --------
@router.put("/{id}", response_model=TrackLineRead)
def update_track_line(
    id: int,
    payload: TrackLineCreate,
    db: Session = Depends(get_db),
):
    r = db.get(TrackLine, id)
    if not r:
        raise HTTPException(404, "Track line not found")

    r.Name = payload.name
    r.Description = payload.description
    # length field doesn't exist in new schema, removing
    r.IsActive = payload.isActive
    db.commit()
    db.refresh(r)
    return TrackLineRead(
        id=r.Id,
        name=r.Name,
        description=r.Description,
        isActive=r.IsActive,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_track_line(id: int, db: Session = Depends(get_db)):
    r = db.get(TrackLine, id)
    if not r:
        raise HTTPException(404, "Track line not found")
    
    # Check if there are sections using this track line
    from models import Section
    if db.query(Section).filter(Section.TrackLineId == id).first():
        raise HTTPException(400, "Track line has sections; reassign or delete them first")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}