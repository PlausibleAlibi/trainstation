from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from db import SessionLocal
from models import Category, Accessory
from schemas import CategoryRead, CategoryCreate, CategoryCount

router = APIRouter(prefix="/categories", tags=["categories"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- list/create ----------
@router.get("", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(Category).order_by(Category.sort_order, Category.name).all()
    return [CategoryRead(id=r.id, name=r.name, description=r.description, sortOrder=r.sort_order) for r in rows]

@router.post("", response_model=CategoryRead)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    exists = db.query(Category).filter(Category.name == payload.name).first()
    if exists:
        raise HTTPException(400, "Category name already exists")
    row = Category(name=payload.name, description=payload.description, sort_order=payload.sortOrder or 0)
    db.add(row)
    db.commit()
    db.refresh(row)
    return CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

# ---------- STATS (place BEFORE /{id}) ----------
@router.get("/stats", response_model=list[CategoryCount])
def category_stats(db: Session = Depends(get_db)):
    rows = (
        db.query(
            Category.id.label("category_id"),
            func.count(Accessory.id).label("cnt"),
        )
        .outerjoin(Accessory, Accessory.category_id == Category.id)
        .group_by(Category.id)
        .order_by(Category.sort_order.asc(), Category.name.asc())
        .all()
    )
    return [CategoryCount(categoryId=r.category_id, count=int(r.cnt or 0)) for r in rows]

# ---------- item routes ----------
@router.get("/{id}", response_model=CategoryRead)
def get_category(id: int, db: Session = Depends(get_db)):
    row = db.query(Category).get(id)  # or: db.get(Category, id) on SQLAlchemy 2.x
    if not row:
        raise HTTPException(404, "Category not found")
    return CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

@router.put("/{id}", response_model=CategoryRead)
def update_category(id: int, payload: CategoryCreate, db: Session = Depends(get_db)):
    row = db.query(Category).get(id)
    if not row:
        raise HTTPException(404, "Category not found")
    exists = db.query(Category).filter(Category.name == payload.name, Category.id != id).first()
    if exists:
        raise HTTPException(400, "Category name already exists")
    row.name = payload.name
    row.description = payload.description
    row.sort_order = payload.sortOrder or 0
    db.commit()
    db.refresh(row)
    return CategoryRead(id=row.id, name=row.name, description=row.description, sortOrder=row.sort_order)

@router.delete("/{id}")
def delete_category(id: int, db: Session = Depends(get_db)):
    row = db.query(Category).get(id)
    if not row:
        raise HTTPException(404, "Category not found")
    if db.query(Accessory).filter(Accessory.category_id == id).first():
        raise HTTPException(400, "Category has accessories; reassign or delete them first")
    db.delete(row)
    db.commit()
    return {"status": "ok"}