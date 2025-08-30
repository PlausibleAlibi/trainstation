import threading
import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import SessionLocal
from .. import models
from ..schemas import ApplyRequest, ControlType
from ..hardware.provider import HardwareProvider

router = APIRouter(prefix="/actions", tags=["actions"])
hw = HardwareProvider()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------- helpers ---------------------------

def _get_accessory_or_404(db: Session, id: int) -> models.Accessory:
    acc = db.query(models.Accessory).get(id)
    if not acc:
        raise HTTPException(404, "Accessory not found")
    if acc.is_active is False:
        raise HTTPException(400, "Accessory is inactive")
    return acc


def _delayed_off(address: str, ms: int):
    time.sleep(ms / 1000)
    hw.set_off(address)


# ----------------------- explicit actions ----------------------

@router.post("/accessories/{id}/on")
def accessory_on(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_on(acc.address)
    return {"status": "ok"}


@router.post("/accessories/{id}/off")
def accessory_off(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_off(acc.address)
    return {"status": "ok"}


@router.post("/accessories/{id}/pulse/{ms}")
def accessory_pulse(id: int, ms: int, db: Session = Depends(get_db)):
    if ms <= 0 or ms > 10000:
        raise HTTPException(400, "ms must be between 1 and 10000")
    acc = _get_accessory_or_404(db, id)
    hw.pulse(acc.address, ms)
    return {"status": "ok", "ms": ms}


# ------------------- controlType-aware apply -------------------

@router.post("/accessories/{id}/apply")
def accessory_apply(
    id: int,
    body: ApplyRequest | None = None,   # state (on/off) only relevant for onOff; milliseconds for timed
    db: Session = Depends(get_db),
):
    """
    Applies the accessory's controlType:

      • onOff  -> use optional body.state = "on" | "off" (defaults to "on")
      • toggle -> 250 ms pulse
      • timed  -> ON then OFF after body.milliseconds (default 5000)
    """
    acc = _get_accessory_or_404(db, id)
    ctype = acc.control_type

    if ctype == ControlType.onOff.value:
        state = (body.state.lower() if body and body.state else "on")
        if state not in ("on", "off"):
            raise HTTPException(400, "state must be 'on' or 'off'")
        if state == "on":
            hw.set_on(acc.address)
        else:
            hw.set_off(acc.address)
        return {"status": "ok", "action": "onOff", "state": state}

    if ctype == ControlType.toggle.value:
        ms = 250
        hw.pulse(acc.address, ms)
        return {"status": "ok", "action": "pulse", "ms": ms}

    if ctype == ControlType.timed.value:
        ms = (body.milliseconds if body else 5000)
        if ms <= 0 or ms > 600000:  # 10-minute safety cap
            raise HTTPException(400, "milliseconds must be between 1 and 600000")
        hw.set_on(acc.address)
        threading.Thread(target=_delayed_off, args=(acc.address, ms), daemon=True).start()
        return {"status": "ok", "action": "timed", "ms": ms}

    raise HTTPException(400, "Unknown controlType")