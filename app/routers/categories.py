from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("", response_model=schemas.CategoryRead)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Category).filter(models.Category.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Category name already exists")
    row = models.Category(
        name=payload.name,
        description=payload.description,
        sort_order=payload.sortOrder
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return schemas.CategoryRead(
        id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order
    )

@router.get("", response_model=list[schemas.CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(models.Category).order_by(models.Category.sort_order, models.Category.name).all()
    return [
        schemas.CategoryRead(
            id=r.id, name=r.name, description=r.description, sortOrder=r.sort_order
        ) for r in rows
    ]