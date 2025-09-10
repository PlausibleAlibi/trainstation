from typing import Optional
import threading
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import SessionLocal
import models, schemas
from hardware.provider import HardwareProvider

router = APIRouter(prefix="/actions", tags=["actions"])
hw = HardwareProvider()


# ---- DB session dependency ---------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---- Helpers -----------------------------------------------------------------
def _delayed_off(address: str, ms: int):
    """Background helper to turn an accessory OFF after ms milliseconds."""
    try:
        time.sleep(ms / 1000.0)
        hw.set_off(address)
    except Exception:
        # Intentionally swallow exceptions to avoid crashing the thread.
        # Consider logging if you add a logger.
        pass


def _get_accessory_or_404(db: Session, id: int) -> models.Accessory:
    acc = db.get(models.Accessory, id)  # SQLAlchemy 2.x style
    if not acc:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return acc


# ---- Simple actions -----------------------------------------------------------
@router.post("/accessories/{id}/on")
def accessory_on(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_on(acc.Address)
    return {"status": "ok", "action": "on", "id": id}


@router.post("/accessories/{id}/off")
def accessory_off(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_off(acc.Address)
    return {"status": "ok", "action": "off", "id": id}


@router.post("/accessories/{id}/pulse/{ms}")
def accessory_pulse(id: int, ms: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    if ms <= 0:
        raise HTTPException(status_code=400, detail="ms must be > 0")
    hw.pulse(acc.Address, ms)
    return {"status": "ok", "action": "pulse", "id": id, "ms": ms}


# ---- Smart "apply" action -----------------------------------------------------
@router.post("/accessories/{id}/apply")
def accessory_apply(
    id: int,
    body: Optional[schemas.ApplyRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Applies the 'intended' behavior for an accessory based on its controlType.
    - onOff:  state "on"/"off" (default "on")
    - toggle: pulse for milliseconds (default 250ms)
    - timed:  ON then OFF after requested/accessory.TimedMs/fallback(5000ms)
    """
    acc = _get_accessory_or_404(db, id)
    ctype = acc.ControlType  # stored as string matching schemas.ControlType values

    # ---- onOff ----
    if ctype == schemas.ControlType.onOff.value:
        state = (body.state if body and body.state else "on")  # type: ignore[attr-defined]
        if state not in ("on", "off"):
            raise HTTPException(status_code=400, detail="Invalid state for onOff (use 'on' or 'off')")
        if state == "on":
            hw.set_on(acc.Address)
        else:
            hw.set_off(acc.Address)
        return {"status": "ok", "action": "onOff", "state": state, "id": id}

    # ---- toggle ----
    if ctype == schemas.ControlType.toggle.value:
        ms = None
        if body and getattr(body, "milliseconds", None) is not None:  # type: ignore[attr-defined]
            ms = int(body.milliseconds)  # type: ignore[attr-defined]
        if not ms or ms <= 0:
            ms = 250
        hw.pulse(acc.Address, ms)
        return {"status": "ok", "action": "toggle", "ms": ms, "id": id}

    # ---- timed ----
    if ctype == schemas.ControlType.timed.value:
        # precedence: request body -> accessory.TimedMs -> fallback
        requested = getattr(body, "milliseconds", None) if body else None  # type: ignore[attr-defined]
        ms = int(requested) if (requested is not None and int(requested) > 0) else (acc.TimedMs or 5000)  # type: ignore[attr-defined]
        if ms <= 0:
            ms = 5000
        hw.set_on(acc.Address)
        # fire-and-forget OFF
        threading.Thread(target=_delayed_off, args=(acc.Address, ms), daemon=True).start()
        return {"status": "ok", "action": "timed", "ms": ms, "id": id}

    raise HTTPException(status_code=400, detail="Unknown controlType")