from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..db import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/accessories", tags=["accessories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=schemas.AccessoryRead)
def create_accessory(payload: schemas.AccessoryCreate, db: Session = Depends(get_db)):
    # Optional: validate category exists
    cat = db.query(models.Category).get(payload.categoryId)
    if not cat:
        raise HTTPException(status_code=400, detail="categoryId does not exist")

    item = models.Accessory(
        name=payload.name,
        category_id=payload.categoryId,
        control_type=payload.controlType,
        address=payload.address,
        is_active=payload.isActive,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return schemas.AccessoryRead(
        id=item.id,
        name=item.name,
        categoryId=item.category_id,
        controlType=item.control_type,
        address=item.address,
        isActive=item.is_active,
    )

@router.get("", response_model=list[schemas.AccessoryRead] | list[schemas.AccessoryWithCategory])
def list_accessories(
    includeCategory: bool = Query(default=False), db: Session = Depends(get_db)
):
    rows = db.query(models.Accessory).all()
    if not includeCategory:
        return [
            schemas.AccessoryRead(
                id=r.id,
                name=r.name,
                categoryId=r.category_id,
                controlType=r.control_type,
                address=r.address,
                isActive=r.is_active,
            ) for r in rows
        ]
    # includeCategory=True
    return [
        schemas.AccessoryWithCategory(
            id=r.id,
            name=r.name,
            categoryId=r.category_id,
            controlType=r.control_type,
            address=r.address,
            isActive=r.is_active,
            category=schemas.CategoryRead(
                id=r.category.id,
                name=r.category.name,
                description=r.category.description,
                sortOrder=r.category.sort_order,
            ) if r.category else None
        ) for r in rows
    ]