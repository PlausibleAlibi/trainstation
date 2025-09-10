from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from db import SessionLocal
from models import AssetLocationEvent, TrainAsset
from schemas import (
    AssetLocationEventCreate,
    AssetLocationEventRead,
    AssetLocationEventWithAsset,
    TrainAssetRead,
)

router = APIRouter(prefix="/assetLocationEvents", tags=["assetLocationEvents"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=AssetLocationEventRead)
def create_asset_location_event(payload: AssetLocationEventCreate, db: Session = Depends(get_db)):
    # Validate asset exists
    asset = db.get(TrainAsset, payload.assetId)
    if not asset:
        raise HTTPException(status_code=400, detail="assetId does not exist")

    item = AssetLocationEvent(
        AssetId=payload.assetId,
        RfidTagId=payload.rfidTagId,
        Location=payload.location,
        ReaderId=payload.readerId,
        Timestamp=datetime.utcnow(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return AssetLocationEventRead(
        eventId=item.EventId,
        assetId=item.AssetId,
        rfidTagId=item.RfidTagId,
        location=item.Location,
        readerId=item.ReaderId,
        timestamp=item.Timestamp,
    )

# -------- List --------
@router.get("", response_model=list[AssetLocationEventRead] | list[AssetLocationEventWithAsset])
def list_asset_location_events(
    includeAsset: bool = Query(default=False),
    assetId: Optional[int] = Query(default=None),
    rfidTagId: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    readerId: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(AssetLocationEvent)
    if assetId is not None:
        qry = qry.filter(AssetLocationEvent.AssetId == assetId)
    if rfidTagId is not None:
        qry = qry.filter(AssetLocationEvent.RfidTagId == rfidTagId)
    if location is not None:
        qry = qry.filter(AssetLocationEvent.Location.ilike(f"%{location}%"))
    if readerId is not None:
        qry = qry.filter(AssetLocationEvent.ReaderId == readerId)
    
    rows = qry.order_by(AssetLocationEvent.Timestamp.desc()).offset(offset).limit(limit).all()

    if not includeAsset:
        return [
            AssetLocationEventRead(
                eventId=r.EventId,
                assetId=r.AssetId,
                rfidTagId=r.RfidTagId,
                location=r.Location,
                readerId=r.ReaderId,
                timestamp=r.Timestamp,
            ) for r in rows
        ]

    return [
        AssetLocationEventWithAsset(
            eventId=r.EventId,
            assetId=r.AssetId,
            rfidTagId=r.RfidTagId,
            location=r.Location,
            readerId=r.ReaderId,
            timestamp=r.Timestamp,
            asset=TrainAssetRead(
                id=r.Asset.Id,
                assetId=r.Asset.AssetId,
                rfidTagId=r.Asset.RfidTagId,
                type=r.Asset.Type,
                roadNumber=r.Asset.RoadNumber,
                description=r.Asset.Description,
                active=r.Asset.Active,
                dateAdded=r.Asset.DateAdded,
            ) if r.Asset else None,
        ) for r in rows
    ]

# -------- Read by id --------
@router.get("/{eventId}", response_model=AssetLocationEventWithAsset)
def get_asset_location_event(eventId: int, db: Session = Depends(get_db)):
    r = db.get(AssetLocationEvent, eventId)
    if not r:
        raise HTTPException(404, "Asset location event not found")
    
    return AssetLocationEventWithAsset(
        eventId=r.EventId,
        assetId=r.AssetId,
        rfidTagId=r.RfidTagId,
        location=r.Location,
        readerId=r.ReaderId,
        timestamp=r.Timestamp,
        asset=TrainAssetRead(
            id=r.Asset.Id,
            assetId=r.Asset.AssetId,
            rfidTagId=r.Asset.RfidTagId,
            type=r.Asset.Type,
            roadNumber=r.Asset.RoadNumber,
            description=r.Asset.Description,
            active=r.Asset.Active,
            dateAdded=r.Asset.DateAdded,
        ) if r.Asset else None,
    )

# -------- Delete --------
@router.delete("/{eventId}")
def delete_asset_location_event(eventId: int, db: Session = Depends(get_db)):
    r = db.get(AssetLocationEvent, eventId)
    if not r:
        raise HTTPException(404, "Asset location event not found")
    db.delete(r)
    db.commit()
    return {"status": "ok"}

# -------- Get latest location for asset --------
@router.get("/assets/{assetId}/latest", response_model=Optional[AssetLocationEventRead])
def get_latest_location_for_asset(assetId: int, db: Session = Depends(get_db)):
    """Get the most recent location event for a specific asset"""
    # Validate asset exists
    asset = db.get(TrainAsset, assetId)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    event = db.query(AssetLocationEvent)\
        .filter(AssetLocationEvent.AssetId == assetId)\
        .order_by(AssetLocationEvent.Timestamp.desc())\
        .first()
    
    if not event:
        return None
        
    return AssetLocationEventRead(
        eventId=event.EventId,
        assetId=event.AssetId,
        rfidTagId=event.RfidTagId,
        location=event.Location,
        readerId=event.ReaderId,
        timestamp=event.Timestamp,
    )