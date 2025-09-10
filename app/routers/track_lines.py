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
        name=payload.name,
        description=payload.description,
        length=payload.length,
        is_active=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return TrackLineRead(
        id=item.id,
        name=item.name,
        description=item.description,
        length=item.length,
        isActive=item.is_active,
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
        qry = qry.filter(TrackLine.is_active == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            (TrackLine.name.ilike(like)) |
            (TrackLine.description.ilike(like))
        )
    rows = qry.order_by(TrackLine.name.asc()).offset(offset).limit(limit).all()

    if not includeSections:
        return [
            TrackLineRead(
                id=r.id,
                name=r.name,
                description=r.description,
                length=r.length,
                isActive=r.is_active,
            ) for r in rows
        ]

    from schemas import SectionRead
    return [
        TrackLineWithSections(
            id=r.id,
            name=r.name,
            description=r.description,
            length=r.length,
            isActive=r.is_active,
            sections=[
                SectionRead(
                    id=s.id,
                    name=s.name,
                    trackLineId=s.track_line_id,
                    startPosition=s.start_position,
                    endPosition=s.end_position,
                    length=s.length,
                    isOccupied=s.is_occupied,
                    isActive=s.is_active,
                ) for s in r.sections
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
        id=r.id,
        name=r.name,
        description=r.description,
        length=r.length,
        isActive=r.is_active,
        sections=[
            SectionRead(
                id=s.id,
                name=s.name,
                trackLineId=s.track_line_id,
                startPosition=s.start_position,
                endPosition=s.end_position,
                length=s.length,
                isOccupied=s.is_occupied,
                isActive=s.is_active,
            ) for s in r.sections
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

    r.name = payload.name
    r.description = payload.description
    r.length = payload.length
    r.is_active = payload.isActive
    db.commit()
    db.refresh(r)
    return TrackLineRead(
        id=r.id,
        name=r.name,
        description=r.description,
        length=r.length,
        isActive=r.is_active,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_track_line(id: int, db: Session = Depends(get_db)):
    r = db.get(TrackLine, id)
    if not r:
        raise HTTPException(404, "Track line not found")
    
    # Check if there are sections using this track line
    from models import Section
    if db.query(Section).filter(Section.track_line_id == id).first():
        raise HTTPException(400, "Track line has sections; reassign or delete them first")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}