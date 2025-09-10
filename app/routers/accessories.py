from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func  # keep if you use it later

from db import SessionLocal
from models import Accessory, Category
from schemas import (
    AccessoryCreate,
    AccessoryUpdate,         # if you actually use a different schema for update
    AccessoryRead,
    AccessoryWithCategory,
    CategoryRead,
)

router = APIRouter(prefix="/accessories", tags=["accessories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Create --------
@router.post("", response_model=AccessoryRead)
def create_accessory(payload: AccessoryCreate, db: Session = Depends(get_db)):
    # Validate category exists
    cat = db.get(Category, payload.categoryId)
    if not cat:
        raise HTTPException(status_code=400, detail="categoryId does not exist")

    item = Accessory(
        Name=payload.name,
        CategoryId=payload.categoryId,
        ControlType=payload.controlType,
        Address=payload.address,
        IsActive=payload.isActive,
        TimedMs=payload.timedMs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return AccessoryRead(
        id=item.Id,
        name=item.Name,
        categoryId=item.CategoryId,
        controlType=item.ControlType,
        address=item.Address,
        isActive=item.IsActive,
        timedMs=item.TimedMs,
    )

# -------- List (with filters & optional embedded category) --------
@router.get("", response_model=list[AccessoryRead] | list[AccessoryWithCategory])
def list_accessories(
    includeCategory: bool = Query(default=False),
    categoryId: Optional[int] = Query(default=None),
    active: Optional[bool] = Query(default=None),
    q: Optional[str] = Query(default=None, description="search in name or address"),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    qry = db.query(Accessory)
    if categoryId is not None:
        qry = qry.filter(Accessory.CategoryId == categoryId)
    if active is not None:
        qry = qry.filter(Accessory.IsActive == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            (Accessory.Name.ilike(like)) |
            (Accessory.Address.ilike(like))
        )
    rows = qry.order_by(Accessory.Name.asc()).offset(offset).limit(limit).all()

    if not includeCategory:
        return [
            AccessoryRead(
                id=r.Id,
                name=r.Name,
                categoryId=r.CategoryId,
                controlType=r.ControlType,
                address=r.Address,
                isActive=r.IsActive,
                timedMs=r.TimedMs,
            ) for r in rows
        ]

    return [
        AccessoryWithCategory(
            id=r.Id,
            name=r.Name,
            categoryId=r.CategoryId,
            controlType=r.ControlType,
            address=r.Address,
            isActive=r.IsActive,
            category=CategoryRead(
                id=r.Category.Id,
                name=r.Category.Name,
                description=r.Category.Description,
                sortOrder=r.Category.SortOrder,
            ) if r.Category else None,
        ) for r in rows
    ]

# -------- Read by id (with embedded category) --------
@router.get("/{id}", response_model=AccessoryWithCategory)
def get_accessory(id: int, db: Session = Depends(get_db)):
    r = db.get(Accessory, id)  # SQLAlchemy 2.x style
    if not r:
        raise HTTPException(404, "Accessory not found")
    return AccessoryWithCategory(
        id=r.Id,
        name=r.Name,
        categoryId=r.CategoryId,
        controlType=r.ControlType,
        address=r.Address,
        isActive=r.IsActive,
        category=CategoryRead(
            id=r.Category.Id,
            name=r.Category.Name,
            description=r.Category.Description,
            sortOrder=r.Category.SortOrder,
        ) if r.Category else None,
    )

# -------- Update --------
@router.put("/{id}", response_model=AccessoryRead)
def update_accessory(
    id: int,
    payload: AccessoryCreate,   # or AccessoryUpdate if you have one
    db: Session = Depends(get_db),
):
    r = db.get(Accessory, id)
    if not r:
        raise HTTPException(404, "Accessory not found")

    # Validate category exists
    cat = db.get(Category, payload.categoryId)
    if not cat:
        raise HTTPException(400, "categoryId does not exist")

    r.Name = payload.name
    r.CategoryId = payload.categoryId
    r.ControlType = payload.controlType
    r.Address = payload.address
    r.IsActive = payload.isActive
    r.TimedMs = payload.timedMs
    db.commit()
    db.refresh(r)
    return AccessoryRead(
        id=r.Id,
        name=r.Name,
        categoryId=r.CategoryId,
        controlType=r.ControlType,
        address=r.Address,
        isActive=r.IsActive,
        timedMs=r.TimedMs,
    )

# -------- Delete --------
@router.delete("/{id}")
def delete_accessory(id: int, db: Session = Depends(get_db)):
    r = db.get(Accessory, id)
    if not r:
        raise HTTPException(404, "Accessory not found")
    db.delete(r)
    db.commit()
    return {"status": "ok"}