from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

def generate_token():
    return uuid.uuid4().hex

class Client(db.Model):
    __tablename__ = "clients"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    senha_hash = db.Column(db.String(300), nullable=False)
    auth_token = db.Column(db.String(64), unique=True, index=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Provider(db.Model):
    __tablename__ = "providers"
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200), unique=True, nullable=False)
    profissao = db.Column(db.String(150), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    senha_hash = db.Column(db.String(300), nullable=False)
    fotos_base64 = db.Column(db.Text, nullable=True)  # armazenará JSON string de lista base64
    auth_token = db.Column(db.String(64), unique=True, index=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = "chat_messages"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("clients.id"), nullable=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("providers.id"), nullable=True)
    autor = db.Column(db.String(50), nullable=False)  # 'client' ou 'provider'
    texto = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship("Client")
    provider = db.relationship("Provider")
