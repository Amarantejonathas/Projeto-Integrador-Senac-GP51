import json
import os
from flask import Flask, request, jsonify, send_from_directory, abort
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Client, Provider, ChatMessage, generate_token

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
DATABASE_FILE = os.path.join(BASE_DIR, "conectaserv.db")

def create_app():
    app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path="/static")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DATABASE_FILE}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    CORS(app)

    db.init_app(app)

    @app.route("/")
    def index():
        return send_from_directory(STATIC_FOLDER, "index.html")

    @app.route("/<path:filename>")
    def static_files(filename):
        if ".." in filename:
            abort(404)
        return send_from_directory(STATIC_FOLDER, filename)

    def require_client(auth_header):
        if not auth_header:
            return None
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1]
        return Client.query.filter_by(auth_token=token).first()

    def require_provider(auth_header):
        if not auth_header:
            return None
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None
        token = parts[1]
        return Provider.query.filter_by(auth_token=token).first()

    # Client register
    @app.route("/api/client/register", methods=["POST"])
    def client_register():
        data = request.get_json() or {}
        nome = data.get("nome", "").strip()
        email = data.get("email", "").strip().lower()
        senha = data.get("senha", "")

        if not nome or not email or not senha:
            return jsonify({"error": "Preencha todos os campos"}), 400

        if Client.query.filter_by(email=email).first():
            return jsonify({"error": "E-mail já cadastrado"}), 400

        senha_hash = generate_password_hash(senha)
        client = Client(nome=nome, email=email, senha_hash=senha_hash)
        db.session.add(client)
        db.session.commit()
        return jsonify({"message": "Cadastro realizado"}), 201

    # Client login
    @app.route("/api/client/login", methods=["POST"])
    def client_login():
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        senha = data.get("senha") or ""
        c = Client.query.filter_by(email=email).first()
        if not c or not check_password_hash(c.senha_hash, senha):
            return jsonify({"error": "E-mail ou senha inválidos"}), 401
        token = generate_token()
        c.auth_token = token
        db.session.commit()
        return jsonify({"token": token, "cliente": {"id": c.id, "nome": c.nome, "email": c.email}})

    # Provider register
    @app.route("/api/provider/register", methods=["POST"])
    def provider_register():
        data = request.get_json() or {}
        nome = data.get("nome", "").strip()
        email = (data.get("email") or "").strip().lower()
        profissao = data.get("profissao", "").strip()
        descricao = data.get("descricao", "")
        senha = data.get("senha", "")
        fotos = data.get("fotos", [])

        if not nome or not email or not profissao or not senha:
            return jsonify({"error": "Preencha todos os campos obrigatórios"}), 400

        if Provider.query.filter_by(email=email).first():
            return jsonify({"error": "E-mail já cadastrado"}), 400

        senha_hash = generate_password_hash(senha)
        fotos_json = json.dumps(fotos)
        p = Provider(nome=nome, email=email, profissao=profissao, descricao=descricao,
                     senha_hash=senha_hash, fotos_base64=fotos_json)
        db.session.add(p)
        db.session.commit()
        return jsonify({"message": "Prestador cadastrado"}), 201

    # Provider login
    @app.route("/api/provider/login", methods=["POST"])
    def provider_login():
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        senha = data.get("senha") or ""
        p = Provider.query.filter_by(email=email).first()
        if not p or not check_password_hash(p.senha_hash, senha):
            return jsonify({"error": "E-mail ou senha inválidos"}), 401
        token = generate_token()
        p.auth_token = token
        db.session.commit()
        return jsonify({"token": token, "provider": {"id": p.id, "nome": p.nome, "email": p.email}})

    # List providers
    @app.route("/api/providers", methods=["GET"])
    def list_providers():
        q = (request.args.get("q") or "").strip().lower()
        query = Provider.query
        if q:
            query = query.filter(
                (Provider.nome.ilike(f"%{q}%")) |
                (Provider.profissao.ilike(f"%{q}%")) |
                (Provider.descricao.ilike(f"%{q}%"))
            )
        providers = query.all()
        out = []
        for p in providers:
            try:
                fotos = json.loads(p.fotos_base64) if p.fotos_base64 else []
            except:
                fotos = []
            out.append({
                "id": p.id,
                "nome": p.nome,
                "email": p.email,
                "profissao": p.profissao,
                "descricao": p.descricao,
                "fotos": fotos
            })
        return jsonify(out)

    # ============================================================
    # 🔥 NOVA ROTA — BUSCA POR PROFISSÃO
    # GET /api/provider/search?profissao=xxxx
    # ============================================================
    @app.route("/api/provider/search", methods=["GET"])
    def provider_search():
        profissao = (request.args.get("profissao") or "").strip()

        if not profissao:
            return jsonify({"error": "Parametro 'profissao' é obrigatório"}), 400

        providers = Provider.query.filter(
            Provider.profissao.ilike(f"%{profissao}%")
        ).all()

        result = []
        for p in providers:
            try:
                fotos = json.loads(p.fotos_base64) if p.fotos_base64 else []
            except:
                fotos = []
            result.append({
                "id": p.id,
                "nome": p.nome,
                "profissao": p.profissao,
                "descricao": p.descricao,
                "fotos": fotos
            })

        return jsonify(result), 200

    # Chat send
    @app.route("/api/chat/send", methods=["POST"])
    def chat_send():
        auth = request.headers.get("Authorization", None)
        data = request.get_json() or {}
        texto = (data.get("texto") or "").strip()
        provider_id = data.get("provider_id")
        client_id = data.get("client_id")

        if not texto:
            return jsonify({"error": "Mensagem vazia"}), 400

        client = require_client(auth)
        provider = require_provider(auth)

        if client and provider:
            return jsonify({"error": "Token inválido"}), 401

        if client:
            if not provider_id:
                return jsonify({"error": "provider_id é requerido"}), 400
            p = Provider.query.get(provider_id)
            if not p:
                return jsonify({"error": "Prestador não encontrado"}), 404
            msg = ChatMessage(client_id=client.id, provider_id=p.id, autor="client", texto=texto)
            db.session.add(msg)
            db.session.commit()
            return jsonify({"message": "Enviado", "id": msg.id})

        if provider:
            if not client_id:
                return jsonify({"error": "client_id é requerido"}), 400
            c = Client.query.get(client_id)
            if not c:
                return jsonify({"error": "Cliente não encontrado"}), 404
            msg = ChatMessage(client_id=c.id, provider_id=provider.id, autor="provider", texto=texto)
            db.session.add(msg)
            db.session.commit()
            return jsonify({"message": "Enviado", "id": msg.id})

        return jsonify({"error": "Autenticação requerida"}), 401

    # Chat history
    @app.route("/api/chat/<int:provider_id>/with_client/<int:client_id>", methods=["GET"])
    def chat_history(provider_id, client_id):
        auth = request.headers.get("Authorization", None)
        client = require_client(auth)
        provider = require_provider(auth)
        if not client and not provider:
            return jsonify({"error": "Autenticação requerida"}), 401
        msgs = ChatMessage.query.filter_by(provider_id=provider_id, client_id=client_id).order_by(ChatMessage.created_at).all()
        out = [{"id": m.id, "autor": m.autor, "texto": m.texto, "created_at": m.created_at.isoformat()} for m in msgs]
        return jsonify(out)

    # Provider notifications
    @app.route("/api/provider/notifications", methods=["GET"])
    def provider_notifications():
        auth = request.headers.get("Authorization", None)
        provider = require_provider(auth)
        if not provider:
            return jsonify({"error": "Autenticação de prestador requerida"}), 401
        msgs = ChatMessage.query.filter_by(provider_id=provider.id, autor="client").order_by(ChatMessage.created_at.desc()).limit(20).all()
        out = []
        for m in msgs:
            out.append({
                "id": m.id,
                "from_client_id": m.client_id,
                "texto": m.texto,
                "created_at": m.created_at.isoformat()
            })
        return jsonify(out)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok"})

    return app

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5000, debug=True)
