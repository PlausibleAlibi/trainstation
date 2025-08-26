from app.db import SessionLocal
from app import models

defaults = [
    {"name": "Switches", "description": "Track turnout motors", "sort_order": 1},
    {"name": "Lights", "description": "Yard/building/house lights", "sort_order": 2},
    {"name": "Buildings", "description": "Houses/loads/accessories", "sort_order": 3},
]

db = SessionLocal()
for c in defaults:
    if not db.query(models.Category).filter_by(name=c["name"]).first():
        db.add(models.Category(**c))
db.commit()
db.close()
print("Seeded categories.")