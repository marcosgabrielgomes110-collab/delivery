from pathlib import Path

from pybase.media import MediaStore

from src.database.database import client_path, merchat_path, products_path


_client_media = MediaStore(client_path)
_merchant_media = MediaStore(merchat_path)
_product_media = MediaStore(products_path)


def _get_store(db_name):
    stores = {
        "client": _client_media,
        "merchant": _merchant_media,
        "products": _product_media,
    }
    return stores.get(db_name)


def save_avatar(db_name, record_id, file_path):
    store = _get_store(db_name)
    if store is None:
        return {"error": "banco invalido"}
    filename = store.save(file_path, record_id, "avatar")
    return {"filename": filename}


def get_image(db_name, filename):
    store = _get_store(db_name)
    if store is None:
        return None
    try:
        return store.get(filename)
    except FileNotFoundError:
        return None


def delete_image(db_name, filename):
    store = _get_store(db_name)
    if store is None:
        return {"error": "banco invalido"}
    try:
        store.delete(filename)
        return {"success": True}
    except FileNotFoundError:
        return {"error": "arquivo nao encontrado"}
