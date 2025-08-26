from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from .. import models
from ..hardware.provider import HardwareProvider

router = APIRouter(prefix="/actions", tags=["actions"])
hw = HardwareProvider()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.post("/accessories/{id}/on")
def accessory_on(id: int, db: Session = Depends(get_db)):
    acc = db.query(models.Accessory).get(id)
    if not acc: raise HTTPException(404, "Accessory not found")
    hw.set_on(acc.address)
    return {"status": "ok"}

@router.post("/accessories/{id}/off")
def accessory_off(id: int, db: Session = Depends(get_db)):
    acc = db.query(models.Accessory).get(id)
    if not acc: raise HTTPException(404, "Accessory not found")
    hw.set_off(acc.address)
    return {"status": "ok"}

@router.post("/accessories/{id}/pulse/{ms}")
def accessory_pulse(id: int, ms: int, db: Session = Depends(get_db)):
    acc = db.query(models.Accessory).get(id)
    if not acc: raise HTTPException(404, "Accessory not found")
    hw.pulse(acc.address, ms)
    return {"status": "ok"}