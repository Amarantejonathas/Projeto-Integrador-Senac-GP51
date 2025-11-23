# db_init.py
from app import create_app
from models import db

app = create_app()
with app.app_context():
    db.drop_all()
    db.create_all()
    print("Banco SQLite criado/zerado com sucesso.")
