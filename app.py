from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import os

# -------------------------
# App & Database setup
# -------------------------
app = Flask(__name__)
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "conectaserv.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "troque-esta-chave-por-uma-segura"  # mudar em produção
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# -------------------------
# Models
# -------------------------
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "client" or "provider"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    provider_profile = db.relationship("ProviderProfile", backref="user", uselist=False)
    portfolios = db.relationship("PortfolioItem", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def as_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email, "role": self.role}

class ProviderProfile(db.Model):
    __tablename__ = "provider_profiles"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    profession = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.Text)
    rating = db.Column(db.Float, default=0.0)
    total_reviews = db.Column(db.Integer, default=0)

class PortfolioItem(db.Model):
    __tablename__ = "portfolio_items"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200))
    description = db.Column(db.Text)
    image_path = db.Column(db.String(300))  # path to file on disk or url
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

class Contract(db.Model):
    __tablename__ = "contracts"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    description = db.Column(db.Text)
    amount = db.Column(db.Float, nullable=False, default=0.0)
    paid = db.Column(db.Boolean, default=False)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Review(db.Model):
    __tablename__ = "reviews"
    id = db.Column(db.Integer, primary_key=True)
    contract_id = db.Column(db.Integer, db.ForeignKey("contracts.id"), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Message(db.Model):
    __tablename__ = "messages"
    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# -------------------------
# Helpers
# -------------------------
def update_provider_rating(provider_id):
    reviews = Review.query.filter_by(provider_id=provider_id).all()
    if not reviews:
        profile = ProviderProfile.query.filter_by(user_id=provider_id).first()
        if profile:
            profile.rating = 0
            profile.total_reviews = 0
            db.session.commit()
        return
    avg = sum(r.rating for r in reviews) / len(reviews)
    profile = ProviderProfile.query.filter_by(user_id=provider_id).first()
    if profile:
        profile.rating = round(avg, 2)
        profile.total_reviews = len(reviews)
        db.session.commit()

# -------------------------
# Routes - Auth
# -------------------------
@app.route("/auth/register", methods=["POST"])
def register():
    """
    JSON expected:
    {
      "name": "...",
      "email": "...",
      "password": "...",
      "role": "client" | "provider",
      "profession": "eletricista" (optional, for providers),
      "bio": "..."
    }
    """
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role")

    if not (name and email and password and role):
        return jsonify({"msg": "name, email, password and role são obrigatórios"}), 400

    if role not in ("client", "provider"):
        return jsonify({"msg": "role inválido"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "E-mail já cadastrado"}), 400

    user = User(name=name, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    if role == "provider":
        profession = data.get("profession", "Não informado")
        bio = data.get("bio", "")
        profile = ProviderProfile(user_id=user.id, profession=profession, bio=bio)
        db.session.add(profile)
        db.session.commit()

    return jsonify({"msg": "Usuário criado", "user": user.as_dict()}), 201

@app.route("/auth/login", methods=["POST"])
def login():
    """
    JSON:
    {
      "email": "...",
      "password": "..."
    }
    """
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    if not (email and password):
        return jsonify({"msg": "email e password obrigatórios"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Credenciais inválidas"}), 401

    access_token = create_access_token(identity={"id": user.id, "role": user.role})
    return jsonify({"access_token": access_token, "user": user.as_dict()}), 200

# -------------------------
# Routes - Providers listing & search (public)
# -------------------------
@app.route("/providers", methods=["GET"])
def list_providers():
    """
    Query params:
      q = search term (profession or name)
    """
    q = request.args.get("q", "").strip().lower()
    query = db.session.query(User).join(ProviderProfile).filter(User.role == "provider")

    if q:
        # basic search by profession or name
        query = query.filter(
            db.or_(
                db.func.lower(ProviderProfile.profession).like(f"%{q}%"),
                db.func.lower(User.name).like(f"%{q}%")
            )
        )
    results = []
    for u in query.all():
        profile = u.provider_profile
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "profession": profile.profession if profile else None,
            "bio": profile.bio if profile else None,
            "rating": profile.rating if profile else 0,
            "total_reviews": profile.total_reviews if profile else 0
        })
    return jsonify(results), 200

# -------------------------
# Routes - Provider portfolio (upload simulado)
# -------------------------
@app.route("/providers/<int:provider_id>/portfolio", methods=["POST"])
@jwt_required()
def add_portfolio(provider_id):
    """
    Protected. JWT must be of the provider who owns the profile OR admin.
    JSON:
      { "title": "...", "description": "...", "image_path": "url-or-filename" }
    """
    identity = get_jwt_identity()
    if identity["id"] != provider_id:
        return jsonify({"msg": "Não autorizado a alterar esse portfólio"}), 403

    user = User.query.get(provider_id)
    if not user or user.role != "provider":
        return jsonify({"msg": "Usuário não é provider ou não existe"}), 404

    data = request.get_json() or {}
    title = data.get("title", "Sem título")
    description = data.get("description", "")
    image_path = data.get("image_path", "")

    item = PortfolioItem(user_id=provider_id, title=title, description=description, image_path=image_path)
    db.session.add(item)
    db.session.commit()
    return jsonify({"msg": "Item adicionado ao portfólio", "item": {
        "id": item.id, "title": item.title, "description": item.description, "image_path": item.image_path
    }}), 201

@app.route("/providers/<int:provider_id>/portfolio", methods=["GET"])
def get_portfolio(provider_id):
    items = PortfolioItem.query.filter_by(user_id=provider_id).all()
    out = [{"id": i.id, "title": i.title, "description": i.description, "image_path": i.image_path} for i in items]
    return jsonify(out), 200

# -------------------------
# Routes - Notifications (client notifies provider of interest)
# -------------------------
@app.route("/notifications", methods=["POST"])
@jwt_required()
def create_notification():
    """
    JWT of client.
    JSON:
      { "provider_id": X, "message": "Olá, estou interessado" }
    """
    identity = get_jwt_identity()
    client_id = identity["id"]
    data = request.get_json() or {}
    provider_id = data.get("provider_id")
    message = data.get("message", "Cliente interessado")

    if not provider_id:
        return jsonify({"msg": "provider_id obrigatório"}), 400

    provider = User.query.get(provider_id)
    if not provider or provider.role != "provider":
        return jsonify({"msg": "Provider não encontrado"}), 404

    notif = Notification(provider_id=provider_id, client_id=client_id, message=message)
    db.session.add(notif)
    db.session.commit()
    return jsonify({"msg": "Notificação enviada ao prestador", "notification_id": notif.id}), 201

@app.route("/providers/<int:provider_id>/notifications", methods=["GET"])
@jwt_required()
def get_notifications(provider_id):
    identity = get_jwt_identity()
    if identity["id"] != provider_id:
        return jsonify({"msg": "Não autorizado"}), 403
    notifs = Notification.query.filter_by(provider_id=provider_id).order_by(Notification.created_at.desc()).all()
    out = [{"id": n.id, "client_id": n.client_id, "message": n.message, "read": n.read, "created_at": n.created_at.isoformat()} for n in notifs]
    return jsonify(out), 200

# -------------------------
# Routes - Chat (messages)
# -------------------------
@app.route("/messages", methods=["POST"])
@jwt_required()
def send_message():
    """
    JSON: { "receiver_id": X, "text": "..." }
    """
    data = request.get_json() or {}
    receiver_id = data.get("receiver_id")
    text = data.get("text", "")
    if not receiver_id or not text:
        return jsonify({"msg": "receiver_id e text obrigatórios"}), 400
    sender = get_jwt_identity()
    msg = Message(sender_id=sender["id"], receiver_id=receiver_id, text=text)
    db.session.add(msg)
    db.session.commit()
    return jsonify({"msg": "Mensagem enviada", "message_id": msg.id}), 201

@app.route("/conversations/<int:user_a>/<int:user_b>", methods=["GET"])
@jwt_required()
def get_conversation(user_a, user_b):
    identity = get_jwt_identity()
    if identity["id"] not in (user_a, user_b):
        return jsonify({"msg": "Acesso não autorizado à conversa"}), 403
    msgs = Message.query.filter(
        db.or_(
            db.and_(Message.sender_id == user_a, Message.receiver_id == user_b),
            db.and_(Message.sender_id == user_b, Message.receiver_id == user_a)
        )
    ).order_by(Message.created_at.asc()).all()
    out = [{"id": m.id, "from": m.sender_id, "to": m.receiver_id, "text": m.text, "created_at": m.created_at.isoformat()} for m in msgs]
    return jsonify(out), 200

# -------------------------
# Routes - Contracts (contratação / pagamento / conclusão)
# -------------------------
@app.route("/contracts", methods=["POST"])
@jwt_required()
def create_contract():
    """
    JSON:
      { "provider_id": X, "description": "...", "amount": 100.0 }
    JWT must be client.
    """
    identity = get_jwt_identity()
    client_id = identity["id"]
    if identity["role"] != "client":
        return jsonify({"msg": "Apenas clientes podem criar contratos"}), 403

    data = request.get_json() or {}
    provider_id = data.get("provider_id")
    description = data.get("description", "")
    amount = float(data.get("amount", 0.0))

    provider = User.query.get(provider_id)
    if not provider or provider.role != "provider":
        return jsonify({"msg": "Provider inválido"}), 404

    contract = Contract(client_id=client_id, provider_id=provider_id, description=description, amount=amount)
    db.session.add(contract)
    db.session.commit()
    return jsonify({"msg": "Contrato criado", "contract": {
        "id": contract.id, "client_id": contract.client_id, "provider_id": contract.provider_id, "amount": contract.amount
    }}), 201

@app.route("/contracts/<int:contract_id>/pay", methods=["POST"])
@jwt_required()
def pay_contract(contract_id):
    """
    Simula pagamento adiantado.
    Only the client who created contract can pay.
    """
    identity = get_jwt_identity()
    contract = Contract.query.get(contract_id)
    if not contract:
        return jsonify({"msg": "Contrato não encontrado"}), 404
    if contract.client_id != identity["id"]:
        return jsonify({"msg": "Somente o cliente que criou o contrato pode pagar"}), 403
    if contract.paid:
        return jsonify({"msg": "Contrato já foi pago"}), 400

    # Simulação de pagamento (aqui você integraria com gateway real)
    contract.paid = True
    db.session.commit()
    return jsonify({"msg": "Pagamento simulado com sucesso", "contract_id": contract.id}), 200

@app.route("/contracts/<int:contract_id>/complete", methods=["POST"])
@jwt_required()
def complete_contract(contract_id):
    """
    Provider confirma conclusão do serviço.
    """
    identity = get_jwt_identity()
    contract = Contract.query.get(contract_id)
    if not contract:
        return jsonify({"msg": "Contrato não encontrado"}), 404
    if contract.provider_id != identity["id"]:
        return jsonify({"msg": "Apenas o provider responsável pode marcar como concluído"}), 403
    if not contract.paid:
        return jsonify({"msg": "Contrato precisa estar pago antes de concluir"}), 400

    contract.completed = True
    db.session.commit()
    return jsonify({"msg": "Serviço marcado como concluído", "contract_id": contract.id}), 200

# -------------------------
# Routes - Reviews / Avaliações
# -------------------------
@app.route("/reviews", methods=["POST"])
@jwt_required()
def create_review():
    """
    JSON:
      { "contract_id": X, "rating": 1-5, "comment": "..." }
    Only client who belongs to contract can send review, and contract must be completed.
    """
    identity = get_jwt_identity()
    data = request.get_json() or {}
    contract_id = data.get("contract_id")
    rating = int(data.get("rating", 0))
    comment = data.get("comment", "")

    if rating < 1 or rating > 5:
        return jsonify({"msg": "rating deve ser entre 1 e 5"}), 400

    contract = Contract.query.get(contract_id)
    if not contract:
        return jsonify({"msg": "Contrato não encontrado"}), 404
    if contract.client_id != identity["id"]:
        return jsonify({"msg": "Apenas o cliente do contrato pode avaliar"}), 403
    if not contract.completed:
        return jsonify({"msg": "Contrato ainda não foi marcado como concluído"}), 400

    review = Review(contract_id=contract.id, client_id=contract.client_id, provider_id=contract.provider_id, rating=rating, comment=comment)
    db.session.add(review)
    db.session.commit()

    # Atualiza média
    update_provider_rating(contract.provider_id)

    return jsonify({"msg": "Avaliação registrada", "review_id": review.id}), 201

# -------------------------
# Route - Simple health / debug
# -------------------------
@app.route("/")
def index():
    return jsonify({"msg": "API ConectaServ - Rodando", "time": datetime.utcnow().isoformat()}), 200

# -------------------------
# Database initialization helper
# -------------------------
def init_db(seed=False):
    db.create_all()
    if seed:
        # cria alguns usuários de exemplo se não existirem
        if not User.query.filter_by(email="cliente@exemplo.com").first():
            c = User(name="Cliente Exemplo", email="cliente@exemplo.com", role="client")
            c.set_password("senha123")
            db.session.add(c)
        if not User.query.filter_by(email="joao@eletricista.com").first():
            p = User(name="João Eletricista", email="joao@eletricista.com", role="provider")
            p.set_password("senha123")
            db.session.add(p)
            db.session.commit()
            profile = ProviderProfile(user_id=p.id, profession="Eletricista", bio="Instalações residenciais e manutenção")
            db.session.add(profile)
        db.session.commit()

if __name__ == "__main__":
    # Create DB if doesn't exist
    if not os.path.exists(db_path):
        init_db(seed=True)
        print("Banco criado e seed inicial inserida.")
    app.run(host="0.0.0.0", port=5000, debug=True)
