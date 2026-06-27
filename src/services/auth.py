from datetime import datetime, timedelta, timezone

import jwt

from src.configs import jwt_secret, jwt_expiry_minutes
from src.database.database import clients, merchants, tokens


def _get_db(user_type):
    if user_type == "client":
        return clients
    if user_type == "merchant":
        return merchants
    return None


def _generate_token(user_id, user_type):
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "user_type": user_type,
        "iat": now,
        "exp": now + timedelta(minutes=jwt_expiry_minutes),
    }
    return jwt.encode(payload, jwt_secret, algorithm="HS256")


def _token_expired(expires_at):
    return datetime.now(timezone.utc).timestamp() > expires_at


def login(email, password, user_type="client"):
    db = _get_db(user_type)
    if db is None:
        return {"error": "tipo de usuario invalido"}

    rec = db.query.find(email=email)
    if not rec:
        return {"error": "email ou senha invalidos"}

    user = rec[0]

    try:
        db.query.get(id=user["id"])
    except Exception:
        pass

    token = _generate_token(user["id"], user_type)

    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=jwt_expiry_minutes)).timestamp()

    tokens.insert(
        user_id=user["id"],
        user_type=user_type,
        token=token,
        expires_at=expires_at,
    )

    return {
        "token": token,
        "user_id": user["id"],
        "user_type": user_type,
        "user": {
            "id": user["id"],
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "phone": user.get("phone", ""),
            "avatar": str(user.get("avatar", "") or ""),
        },
    }


def validate(token_str):
    try:
        payload = jwt.decode(token_str, jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return {"error": "token expirado"}
    except jwt.InvalidTokenError:
        return {"error": "token invalido"}

    user_id = payload["user_id"]
    user_type = payload["user_type"]

    stored = tokens.query.find(token=token_str)
    if not stored:
        return {"error": "token nao encontrado"}

    token_rec = stored[0]
    if _token_expired(token_rec["expires_at"]):
        tokens.delete(id=token_rec["id"])
        return {"error": "token expirado"}

    return {
        "valid": True,
        "user_id": user_id,
        "user_type": user_type,
    }


def logout(token_str):
    stored = tokens.query.find(token=token_str)
    if not stored:
        return {"error": "token nao encontrado"}

    tokens.delete(id=stored[0]["id"])
    return {"success": True}


def refresh(token_str):
    result = validate(token_str)
    if "error" in result:
        return result

    tokens.delete(id=tokens.query.find(token=token_str)[0]["id"])

    new_token = _generate_token(result["user_id"], result["user_type"])
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=jwt_expiry_minutes)).timestamp()

    tokens.insert(
        user_id=result["user_id"],
        user_type=result["user_type"],
        token=new_token,
        expires_at=expires_at,
    )

    return {
        "token": new_token,
        "user_id": result["user_id"],
        "user_type": result["user_type"],
    }


def logout_all(user_id, user_type="client"):
    all_tokens = tokens.query.all()
    removed = 0
    for t in all_tokens:
        if t["user_id"] == user_id and t["user_type"] == user_type:
            tokens.delete(id=t["id"])
            removed += 1
    return {"success": True, "removed": removed}
