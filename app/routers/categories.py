from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import SessionLocal
from .. import models, schemas

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ---------- list/create ----------
@router.get("", response_model=list[schemas.CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(models.Category).order_by(models.Category.sort_order, models.Category.name).all()
    return [schemas.CategoryRead(id=r.id, name=r.name, description=r.description, sortOrder=r.sort_order) for r in rows]

@router.post("", response_model=schemas.CategoryRead)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    exists = db.query(models.Category).filter(models.Category.name == payload.name).first()
    if exists: raise HTTPException(400, "Category name already exists")
    row = models.Category(name=payload.name, description=payload.description, sort_order=payload.sortOrder or 0)
    db.add(row); db.commit(); db.refresh(row)
    return schemas.CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

# ---------- STATS (place BEFORE /{id}) ----------
@router.get("/stats", response_model=list[schemas.CategoryCount])
def category_stats(db: Session = Depends(get_db)):
    rows = (
        db.query(
            models.Category.id.label("category_id"),
            func.count(models.Accessory.id).label("cnt"),
        )
        .outerjoin(models.Accessory, models.Accessory.category_id == models.Category.id)
        .group_by(models.Category.id)
        .order_by(models.Category.sort_order.asc(), models.Category.name.asc())
        .all()
    )
    return [schemas.CategoryCount(categoryId=r.category_id, count=int(r.cnt or 0)) for r in rows]

# ---------- item routes ----------
@router.get("/{id}", response_model=schemas.CategoryRead)
def get_category(id: int, db: Session = Depends(get_db)):
    row = db.query(models.Category).get(id)
    if not row: raise HTTPException(404, "Category not found")
    return schemas.CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

@router.put("/{id}", response_model=schemas.CategoryRead)
def update_category(id: int, payload: schemas.CategoryCreate, db: Session = Depends(get_db)):
    row = db.query(models.Category).get(id)
    if not row: raise HTTPException(404, "Category not found")
    exists = db.query(models.Category).filter(models.Category.name == payload.name, models.Category.id != id).first()
    if exists: raise HTTPException(400, "Category name already exists")
    row.name = payload.name; row.description = payload.description; row.sort_order = payload.sortOrder or 0
    db.commit(); db.refresh(row)
    return schemas.CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

@router.delete("/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    row = db.query(models.Category).get(id)
    if not row: raise HTTPException(404, "Category not found")
    if db.query(models.Accessory).filter(models.Accessory.category_id == id).first():
        raise HTTPException(400, "Category has accessories; reassign or delete them first")
    db.delete(row); db.commit()
    return {"status": "ok"}