from src.services.auth import login, validate, logout, refresh, logout_all
from src.services.register import register_client, register_merchant
from src.database.database import clients, merchants, tokens


def setup_function():
    for rec in clients.query.all():
        clients.delete(id=rec["id"])
    for rec in merchants.query.all():
        merchants.delete(id=rec["id"])
    for rec in tokens.query.all():
        tokens.delete(id=rec["id"])


def _create_client():
    register_client("Joao", "joao@email.com", "111111111", None, "senha123")


def _create_merchant():
    register_merchant("Loja", "loja@email.com", "333333333", None, "loja123")


def test_login_client_success():
    _create_client()
    result = login("joao@email.com", "senha123", "client")
    assert "token" in result
    assert result["user_type"] == "client"


def test_login_merchant_success():
    _create_merchant()
    result = login("loja@email.com", "loja123", "merchant")
    assert "token" in result
    assert result["user_type"] == "merchant"


def test_login_invalid_email():
    _create_client()
    result = login("wrong@email.com", "senha123", "client")
    assert result == {"error": "email ou senha invalidos"}


def test_login_invalid_user_type():
    _create_client()
    result = login("joao@email.com", "senha123", "admin")
    assert result == {"error": "tipo de usuario invalido"}


def test_validate_token():
    _create_client()
    login_result = login("joao@email.com", "senha123", "client")
    result = validate(login_result["token"])
    assert result["valid"] is True
    assert result["user_type"] == "client"


def test_validate_invalid_token():
    result = validate("token-invalido")
    assert "error" in result


def test_logout():
    _create_client()
    login_result = login("joao@email.com", "senha123", "client")
    result = logout(login_result["token"])
    assert result == {"success": True}

    after = validate(login_result["token"])
    assert "error" in after


def test_logout_nonexistent_token():
    result = logout("token-inexistente")
    assert result == {"error": "token nao encontrado"}


def test_refresh_token():
    _create_client()
    login_result = login("joao@email.com", "senha123", "client")
    old_token = login_result["token"]

    result = refresh(old_token)
    assert "token" in result
    assert result["token"] != old_token

    assert validate(old_token).get("error")
    assert validate(result["token"])["valid"] is True


def test_logout_all():
    _, user_id = register_client("Carlos", "carlos@email.com", "555555555", None, "senha123")
    login("carlos@email.com", "senha123", "client")
    login("carlos@email.com", "senha123", "client")

    result = logout_all(user_id, "client")

    all_tokens = tokens.query.all()
    client_tokens = [t for t in all_tokens if t["user_id"] == user_id]
    assert len(client_tokens) == 0


def test_tokens_persisted_in_db():
    _create_client()
    login("joao@email.com", "senha123", "client")

    all_tokens = tokens.query.all()
    assert len(all_tokens) >= 1
    assert all_tokens[0]["user_type"] == "client"
