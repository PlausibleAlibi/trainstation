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
        name=payload.name,
        category_id=payload.categoryId,
        control_type=payload.controlType,
        address=payload.address,
        is_active=payload.isActive,
        timed_ms=payload.timedMs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return AccessoryRead(
        id=item.id,
        name=item.name,
        categoryId=item.category_id,
        controlType=item.control_type,
        address=item.address,
        isActive=item.is_active,
        timedMs=item.timed_ms,
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
        qry = qry.filter(Accessory.category_id == categoryId)
    if active is not None:
        qry = qry.filter(Accessory.is_active == active)
    if q:
        like = f"%{q}%"
        qry = qry.filter(
            (Accessory.name.ilike(like)) |
            (Accessory.address.ilike(like))
        )
    rows = qry.order_by(Accessory.name.asc()).offset(offset).limit(limit).all()

    if not includeCategory:
        return [
            AccessoryRead(
                id=r.id,
                name=r.name,
                categoryId=r.category_id,
                controlType=r.control_type,
                address=r.address,
                isActive=r.is_active,
                timedMs=r.timed_ms,
            ) for r in rows
        ]

    return [
        AccessoryWithCategory(
            id=r.id,
            name=r.name,
            categoryId=r.category_id,
            controlType=r.control_type,
            address=r.address,
            isActive=r.is_active,
            category=CategoryRead(
                id=r.category.id,
                name=r.category.name,
                description=r.category.description,
                sortOrder=r.category.sort_order,
            ) if r.category else None,
        ) for r in rows
    ]

# -------- Read by id (with embedded category) --------
@router.get("/{id}", response_model=AccessoryWithCategory)
def get_accessory(id: int, db: Session = Depends(get_db)):
    r = db.get(Accessory, id)  # SQLAlchemy 2.x style
    if not r:
        raise HTTPException(404, "Accessory not found")
    return AccessoryWithCategory(
        id=r.id,
        name=r.name,
        categoryId=r.category_id,
        controlType=r.control_type,
        address=r.address,
        isActive=r.is_active,
        category=CategoryRead(
            id=r.category.id,
            name=r.category.name,
            description=r.category.description,
            sortOrder=r.category.sort_order,
        ) if r.category else None,
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

    r.name = payload.name
    r.category_id = payload.categoryId
    r.control_type = payload.controlType
    r.address = payload.address
    r.is_active = payload.isActive
    r.timed_ms = payload.timedMs
    db.commit()
    db.refresh(r)
    return AccessoryRead(
        id=r.id,
        name=r.name,
        categoryId=r.category_id,
        controlType=r.control_type,
        address=r.address,
        isActive=r.is_active,
        timedMs=r.timed_ms,
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