from src.services.register import register_client, register_merchant
from src.database.database import clients, merchants


def setup_function():
    for rec in clients.query.all():
        clients.delete(id=rec["id"])
    for rec in merchants.query.all():
        merchants.delete(id=rec["id"])


def test_register_client_success():
    result = register_client(
        name="Joao",
        email="joao@email.com",
        phone="111111111",
        avatar=None,
        password="senha123",
    )
    assert result[0] is True
    assert result[1] is not None


def test_register_client_duplicate_email():
    register_client("Joao", "joao@email.com", "111111111", None, "senha123")
    result = register_client("Outro", "joao@email.com", "222222222", None, "senha456")
    assert result == {"error": "email ja cadastrado"}


def test_register_client_duplicate_name():
    register_client("Joao", "joao@email.com", "111111111", None, "senha123")
    result = register_client("Joao", "outro@email.com", "222222222", None, "senha456")
    assert result == {"error": "nome de usuario ja existe"}


def test_register_client_duplicate_phone():
    register_client("Joao", "joao@email.com", "111111111", None, "senha123")
    result = register_client("Outro", "outro@email.com", "111111111", None, "senha456")
    assert result == {"error": "numero ja registrado"}


def test_register_merchant_success():
    result = register_merchant(
        name="Loja",
        email="loja@email.com",
        phone="333333333",
        avatar=None,
        password="loja123",
    )
    assert result[0] is True
    assert result[1] is not None


def test_register_merchant_duplicate_email():
    register_merchant("Loja", "loja@email.com", "333333333", None, "loja123")
    result = register_merchant("Outra", "loja@email.com", "444444444", None, "outra123")
    assert result == {"error": "email ja cadastrado"}


def test_register_merchant_duplicate_name():
    register_merchant("Loja", "loja@email.com", "333333333", None, "loja123")
    result = register_merchant("Loja", "outra@email.com", "444444444", None, "outra123")
    assert result == {"error": "nome de usuario ja existe"}


def test_register_merchant_duplicate_phone():
    register_merchant("Loja", "loja@email.com", "333333333", None, "loja123")
    result = register_merchant("Outra", "outra@email.com", "333333333", None, "outra123")
    assert result == {"error": "numero ja registrado"}
