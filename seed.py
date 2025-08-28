from app.db import SessionLocal
from app import models

defaults = [
    {"name":"Switches","description":"Track turnout motors","sort_order":1},
    {"name":"Lights","description":"Yard/buildings","sort_order":2},
    {"name":"Buildings","description":"Animated accessories","sort_order":3},
]
db = SessionLocal()
for d in defaults:
    if not db.query(models.Category).filter_by(name=d["name"]).first():
        db.add(models.Category(**d))
db.commit(); db.close()
print("Seeded.")