from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db import SessionLocal
from models import TrainAsset
from schemas import (
    TrainAssetCreate,
    TrainAssetRead,
    TrainAssetWithEvents,
)

router = APIRouter(prefix="/trainAssets", tags=["trainAssets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=TrainAssetRead)
def create_train_asset(payload: TrainAssetCreate, db: Session = Depends(get_db)):
    # Check if RFID tag ID already exists
    exists = db.query(TrainAsset).filter(TrainAsset.RfidTagId == payload.rfidTagId).first()
    if exists:
        raise HTTPException(400, "RFID Tag ID already exists")
    
    item = TrainAsset(
        AssetId=payload.assetId,
        RfidTagId=payload.rfidTagId,
        Type=payload.type.value,
        RoadNumber=payload.roadNumber,
        Description=payload.description,
        Active=payload.active,
        DateAdded=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return TrainAssetRead(
        id=item.Id,
        assetId=item.AssetId,
        rfidTagId=item.RfidTagId,
        type=item.Type,
        roadNumber=item.RoadNumber,
        description=item.Description,
        active=item.Active,
        dateAdded=item.DateAdded,
    )

# -------- List --------
@router.get("", response_model=list[TrainAssetRead] | list[TrainAssetWithEvents])
def list_train_assets(
    includeEvents: bool = Query(default=False),
    active: Optional[bool] = Query(default=None),
    type: Optional[str] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in road number, asset ID, or description"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(TrainAsset)
    if active is not None:
        qry = qry.filter(TrainAsset.Active == active)
    if type is not None:
        qry = qry.filter(TrainAsset.Type == type)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            (TrainAsset.RoadNumber.ilike(like)) |
            (TrainAsset.AssetId.ilike(like)) |
            (TrainAsset.Description.ilike(like))
        )
    rows = qry.order_by(TrainAsset.RoadNumber.asc()).offset(offset).limit(limit).all()

    if not includeEvents:
        return [
            TrainAssetRead(
                id=r.Id,
                assetId=r.AssetId,
                rfidTagId=r.RfidTagId,
                type=r.Type,
                roadNumber=r.RoadNumber,
                description=r.Description,
                active=r.Active,
                dateAdded=r.DateAdded,
            ) for r in rows
        ]

    from schemas import AssetLocationEventRead
    return [
        TrainAssetWithEvents(
            id=r.Id,
            assetId=r.AssetId,
            rfidTagId=r.RfidTagId,
            type=r.Type,
            roadNumber=r.RoadNumber,
            description=r.Description,
            active=r.Active,
            dateAdded=r.DateAdded,
            locationEvents=[
                AssetLocationEventRead(
                    eventId=e.EventId,
                    assetId=e.AssetId,
                    rfidTagId=e.RfidTagId,
                    location=e.Location,
                    readerId=e.ReaderId,
                    timestamp=e.Timestamp,
                ) for e in r.LocationEvents
            ]
        ) for r in rows
    ]

# -------- Read by id --------
@router.get("/{id}", response_model=TrainAssetWithEvents)
def get_train_asset(id: int, db: Session = Depends(get_db)):
    r = db.get(TrainAsset, id)
    if not r:
        raise HTTPException(404, "Train asset not found")
    
    from schemas import AssetLocationEventRead
    return TrainAssetWithEvents(
        id=r.Id,
        assetId=r.AssetId,
        rfidTagId=r.RfidTagId,
        type=r.Type,
        roadNumber=r.RoadNumber,
        description=r.Description,
        active=r.Active,
        dateAdded=r.DateAdded,
        locationEvents=[
            AssetLocationEventRead(
                eventId=e.EventId,
                assetId=e.AssetId,
                rfidTagId=e.RfidTagId,
                location=e.Location,
                readerId=e.ReaderId,
                timestamp=e.Timestamp,
            ) for e in r.LocationEvents
        ]
    )

# -------- Update --------
@router.put("/{id}", response_model=TrainAssetRead)
def update_train_asset(
    id: int,
    payload: TrainAssetCreate,
    db: Session = Depends(get_db),
):
    r = db.get(TrainAsset, id)
    if not r:
        raise HTTPException(404, "Train asset not found")

    # Check if RFID tag ID already exists for a different asset
    exists = db.query(TrainAsset).filter(TrainAsset.RfidTagId == payload.rfidTagId, TrainAsset.Id != id).first()
    if exists:
        raise HTTPException(400, "RFID Tag ID already exists")

    r.AssetId = payload.assetId
    r.RfidTagId = payload.rfidTagId
    r.Type = payload.type.value
    r.RoadNumber = payload.roadNumber
    r.Description = payload.description
    r.Active = payload.active
    db.commit()
    db.refresh(r)
    return TrainAssetRead(
        id=r.Id,
        assetId=r.AssetId,
        rfidTagId=r.RfidTagId,
        type=r.Type,
        roadNumber=r.RoadNumber,
        description=r.Description,
        active=r.Active,
        dateAdded=r.DateAdded,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_train_asset(id: int, db: Session = Depends(get_db)):
    r = db.get(TrainAsset, id)
    if not r:
        raise HTTPException(404, "Train asset not found")
    
    # Check if there are location events for this asset
    from models import AssetLocationEvent
    if db.query(AssetLocationEvent).filter(AssetLocationEvent.AssetId == id).first():
        raise HTTPException(400, "Train asset has location events; delete them first or set asset as inactive")
    
    db.delete(r)
    db.commit()
    return {"status": "ok"}