from typing import Optional
import threading
import time

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import SessionLocal
from .. import models, schemas
from ..hardware.provider import HardwareProvider

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
    acc = db.query(models.Accessory).get(id)
    if not acc:
        raise HTTPException(status_code=404, detail="Accessory not found")
    return acc


# ---- Simple actions -----------------------------------------------------------
@router.post("/accessories/{id}/on")
def accessory_on(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_on(acc.address)
    return {"status": "ok", "action": "on", "id": id}


@router.post("/accessories/{id}/off")
def accessory_off(id: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    hw.set_off(acc.address)
    return {"status": "ok", "action": "off", "id": id}


@router.post("/accessories/{id}/pulse/{ms}")
def accessory_pulse(id: int, ms: int, db: Session = Depends(get_db)):
    acc = _get_accessory_or_404(db, id)
    if ms <= 0:
        raise HTTPException(status_code=400, detail="ms must be > 0")
    hw.pulse(acc.address, ms)
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
    - onOff:
        - If body.state is "on" or "off", do that.
        - Else default to "on".
    - toggle:
        - Pulse for body.milliseconds if provided, else 250ms default.
    - timed:
        - Turn ON immediately, then OFF after:
            body.milliseconds OR accessory.timed_ms OR 5000ms fallback.
    """
    acc = _get_accessory_or_404(db, id)
    ctype = acc.control_type  # stored as string matching schemas.ControlType enum values

    # ---- onOff ----
    if ctype == schemas.ControlType.onOff.value:
        state = (body.state if body and body.state else "on")  # type: ignore[attr-defined]
        if state not in ("on", "off"):
            raise HTTPException(status_code=400, detail="Invalid state for onOff (use 'on' or 'off')")
        if state == "on":
            hw.set_on(acc.address)
        else:
            hw.set_off(acc.address)
        return {"status": "ok", "action": "onOff", "state": state, "id": id}

    # ---- toggle ----
    if ctype == schemas.ControlType.toggle.value:
        ms = None
        if body and getattr(body, "milliseconds", None) is not None:  # type: ignore[attr-defined]
            ms = int(body.milliseconds)  # type: ignore[attr-defined]
        if not ms or ms <= 0:
            ms = 250
        hw.pulse(acc.address, ms)
        return {"status": "ok", "action": "toggle", "ms": ms, "id": id}

    # ---- timed ----
    if ctype == schemas.ControlType.timed.value:
        # precedence: request body -> accessory.timed_ms -> fallback
        requested = getattr(body, "milliseconds", None) if body else None  # type: ignore[attr-defined]
        ms = int(requested) if (requested is not None and int(requested) > 0) else (acc.timed_ms or 5000)  # type: ignore[attr-defined]
        if ms <= 0:
            ms = 5000
        hw.set_on(acc.address)
        # fire-and-forget OFF
        threading.Thread(target=_delayed_off, args=(acc.address, ms), daemon=True).start()
        return {"status": "ok", "action": "timed", "ms": ms, "id": id}

    raise HTTPException(status_code=400, detail="Unknown controlType")