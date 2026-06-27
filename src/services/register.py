from src.database.database import clients, merchants


def register_client(name, email, phone, avatar, password):
    if clients.query.exists(email=email):
        return {"error": "email ja cadastrado"}
    if clients.query.exists(name=name):
        return {"error": "nome de usuario ja existe"}
    if clients.query.exists(phone=phone):
        return {"error": "numero ja registrado"}
    if not avatar:
        avatar = None
    _id = clients.insert(
        name=name,
        email=email,
        phone=phone,
        avatar=avatar,
        passw=password,
    )
    return True, _id


def register_merchant(name, email, phone, avatar, password):
    if merchants.query.exists(email=email):
        return {"error": "email ja cadastrado"}
    if merchants.query.exists(name=name):
        return {"error": "nome de usuario ja existe"}
    if merchants.query.exists(phone=phone):
        return {"error": "numero ja registrado"}
    if not avatar:
        avatar = None
    _id = merchants.insert(
        name=name,
        email=email,
        phone=phone,
        avatar=avatar,
        passw=password,
    )
    return True, _id

