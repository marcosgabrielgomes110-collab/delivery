from src.configs import path, password
from src.database.database import clients, client_path
from src.schemas.clients import clients_schema


def test_config():
    assert path.exists(), f"Pasta de dados não existe: {path}"
    assert password, "Senha não configurada"


def test_schema():
    assert clients_schema is not None
    assert len(clients_schema.fields) == 5


def test_database():
    assert clients is not None
    assert clients.schema is not None
    assert client_path.exists()


def test_insert_and_query():
    id_ = clients.insert(
        name="Teste",
        email="teste@email.com",
        phone="123456789",
        passw="senha123",
    )
    assert id_ is not None

    rec = clients.query.get(id=id_)
    assert rec["name"] == "Teste"
    assert rec["email"] == "teste@email.com"

    clients.delete(id=id_)


if __name__ == "__main__":
    test_config()
    test_schema()
    test_database()
    test_insert_and_query()
    print("Todos os testes passaram!")
