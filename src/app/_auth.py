import json
import os
import tempfile

from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from src.app.routes import (
    register_client,
    register_merchant,
    login_client,
    login_merchant,
    logout,
    logout_all,
    refresh,
    validate_token,
    media,
    upload_avatar,
    delete_media,
    products_list,
    product_register,
    product_detail,
    product_update,
    product_delete,
    public_products,
    public_merchants,
    public_merchant_detail,
)
from src.app.models import (
    RegisterClient,
    RegisterMerchant,
    LoginRequest,
    LogoutRequest,
    LogoutAllRequest,
    RefreshRequest,
    ValidateRequest,
    UploadAvatar,
)
from src.services.register import register_client as _register_client
from src.services.register import register_merchant as _register_merchant
from src.services.auth import login, logout as _logout, logout_all as _logout_all
from src.services.auth import refresh as _refresh, validate as _validate
from src.services.media import save_avatar, get_image, delete_image
from pybase.media import Media
from src.database.database import products, merchants


COOKIE_MAX_AGE = 60 * 30  # 30 min


def _normalize_photo(rec):
    photo = rec.get("photo")
    if isinstance(photo, Media):
        rec["photo"] = photo.name
    return rec


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Helpers ---

def _set_auth_cookies(response: JSONResponse, data: dict):
    response.set_cookie(
        key="session_id",
        value=data["token"],
        httponly=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )
    response.set_cookie(
        key="user",
        value=json.dumps(data.get("user", {})),
        httponly=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )
    response.set_cookie(
        key="user_type",
        value=data.get("user_type", ""),
        httponly=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def _clear_auth_cookies(response: JSONResponse):
    response.set_cookie("session_id", "", httponly=True, max_age=0, path="/")
    response.set_cookie("user", "", httponly=False, max_age=0, path="/")
    response.set_cookie("user_type", "", httponly=False, max_age=0, path="/")


def _get_token(request: Request, body_token: str | None = None) -> str | None:
    token = request.cookies.get("session_id")
    if token:
        return token
    auth = request.headers.get("Authorization")
    if auth and auth.startswith("Bearer "):
        return auth[7:]
    return body_token


# --- Register ---

@app.post(register_client)
async def route_register_client(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    avatar: UploadFile | None = File(None),
):
    avatar_path = None
    if avatar and avatar.filename:
        suffix = os.path.splitext(avatar.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await avatar.read())
            avatar_path = tmp.name

    try:
        result = _register_client(
            name=name, email=email, phone=phone,
            avatar=avatar_path, password=password,
        )
    finally:
        if avatar_path:
            os.unlink(avatar_path)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"user_id": result[1]}


@app.post(register_merchant)
async def route_register_merchant(
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    avatar: UploadFile | None = File(None),
):
    avatar_path = None
    if avatar and avatar.filename:
        suffix = os.path.splitext(avatar.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await avatar.read())
            avatar_path = tmp.name

    try:
        result = _register_merchant(
            name=name, email=email, phone=phone,
            avatar=avatar_path, password=password,
        )
    finally:
        if avatar_path:
            os.unlink(avatar_path)

    if isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return {"user_id": result[1]}


# --- Auth ---

@app.post(login_client)
def route_login_client(data: LoginRequest):
    result = login(data.email, data.password, "client")
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    response = JSONResponse(content=result)
    _set_auth_cookies(response, result)
    return response


@app.post(login_merchant)
def route_login_merchant(data: LoginRequest):
    result = login(data.email, data.password, "merchant")
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    response = JSONResponse(content=result)
    _set_auth_cookies(response, result)
    return response


@app.post(logout)
def route_logout(request: Request, data: LogoutRequest | None = None):
    token = _get_token(request, data.token if data else None)
    if not token:
        response = JSONResponse(content={"error": "token nao encontrado"})
        _clear_auth_cookies(response)
        return response
    result = _logout(token)
    response = JSONResponse(content=result)
    _clear_auth_cookies(response)
    return response


@app.post(logout_all)
def route_logout_all(data: LogoutAllRequest):
    result = _logout_all(data.user_id, data.user_type)
    response = JSONResponse(content=result)
    _clear_auth_cookies(response)
    return response


@app.post(refresh)
def route_refresh(request: Request, data: RefreshRequest | None = None):
    token = _get_token(request, data.token if data else None)
    if not token:
        raise HTTPException(status_code=401, detail="token nao encontrado")
    result = _refresh(token)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    response = JSONResponse(content=result)
    _set_auth_cookies(response, result)
    return response


@app.post(validate_token)
def route_validate(request: Request, data: ValidateRequest | None = None):
    token = _get_token(request, data.token if data else None)
    if not token:
        raise HTTPException(status_code=401, detail="token nao encontrado")
    result = _validate(token)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return result


# --- Media (public) ---

@app.get(media)
def route_get_image(db_name: str, filename: str):
    img = get_image(db_name, filename)
    if img is None:
        raise HTTPException(status_code=404, detail="imagem nao encontrada")
    return FileResponse(img.path, media_type="image/jpeg")


@app.post(upload_avatar)
async def route_upload_avatar(
    user_id: str = Form(...),
    user_type: str = Form(...),
    file: UploadFile = File(...),
):
    if user_type not in ("client", "merchant"):
        raise HTTPException(status_code=400, detail="tipo de usuario invalido")

    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = save_avatar(user_type, user_id, tmp_path)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return {"filename": result["filename"]}
    finally:
        os.unlink(tmp_path)


@app.delete(delete_media)
def route_delete_media(db_name: str, filename: str):
    result = delete_image(db_name, filename)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


# --- Products ---

@app.get(products_list)
def route_products_list(proprietor: str | None = None):
    all_ = products.query.all()
    if proprietor:
        all_ = [p for p in all_ if p.get("proprietor") == proprietor]
    for p in all_:
        p.pop("passw", None)
        _normalize_photo(p)
    return all_


@app.post(product_register)
async def route_product_register(
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    proprietor: str = Form(...),
    photo: UploadFile = File(...),
    accompaniments: str = Form("[]"),
):
    suffix = os.path.splitext(photo.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await photo.read())
        photo_path = tmp.name

    try:
        try:
            acc_list = json.loads(accompaniments)
        except json.JSONDecodeError:
            acc_list = []

        _id = products.insert(
            name=name,
            photo=photo_path,
            price=price,
            description=description,
            proprietor=proprietor,
            accompaniments=acc_list,
        )
    finally:
        os.unlink(photo_path)

    return {"product_id": _id}


@app.get(product_detail)
def route_product_detail(id: str):
    rec = products.query.get(id=id)
    if not rec:
        raise HTTPException(status_code=404, detail="produto nao encontrado")
    _normalize_photo(rec)
    return rec


@app.put(product_update)
async def route_product_update(
    id: str,
    name: str = Form(None),
    price: float = Form(None),
    description: str = Form(None),
    photo: UploadFile | None = File(None),
    accompaniments: str = Form(None),
):
    rec = products.query.get(id=id)
    if not rec:
        raise HTTPException(status_code=404, detail="produto nao encontrado")

    photo_path = None
    if photo and photo.filename:
        suffix = os.path.splitext(photo.filename)[1] or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(await photo.read())
            photo_path = tmp.name

    try:
        updates = {}
        if name is not None:
            updates["name"] = name
        if price is not None:
            updates["price"] = price
        if description is not None:
            updates["description"] = description
        if accompaniments is not None:
            try:
                updates["accompaniments"] = json.loads(accompaniments)
            except json.JSONDecodeError:
                pass

        if photo_path:
            updates["photo"] = photo_path

        if updates:
            products.update(id=id, **updates)
    finally:
        if photo_path:
            os.unlink(photo_path)

    return {"success": True}


@app.delete(product_delete)
def route_product_delete(id: str):
    rec = products.query.get(id=id)
    if not rec:
        raise HTTPException(status_code=404, detail="produto nao encontrado")
    products.delete(id=id)
    return {"success": True}


# --- Public API ---


@app.get(public_products)
def route_public_products(q: str | None = None, proprietor: str | None = None):
    all_ = products.query.all()
    for p in all_:
        p.pop("passw", None)
        _normalize_photo(p)

    if proprietor:
        all_ = [p for p in all_ if p.get("proprietor") == proprietor]

    if q:
        ql = q.lower()
        merchants_map = {m["id"]: m["name"] for m in merchants.query.all()}
        enriched = []
        for p in all_:
            pname = (p.get("name") or "").lower()
            mname = (merchants_map.get(p.get("proprietor")) or "").lower()
            if ql in pname or ql in mname:
                enriched.append(p)
        return enriched

    return all_


@app.get(public_merchants)
def route_public_merchants(q: str | None = None):
    all_ = merchants.query.all()
    for m in all_:
        m.pop("passw", None)
        m.pop("phone", None)
        m.pop("products", None)

    if q:
        ql = q.lower()
        all_ = [m for m in all_ if ql in (m.get("name") or "").lower()]

    for m in all_:
        product_count = len(products.query.find(proprietor=m["id"]))
        m["product_count"] = product_count

    return all_


@app.get(public_merchant_detail)
def route_public_merchant_detail(id: str):
    rec = merchants.query.get(id=id)
    if not rec:
        raise HTTPException(status_code=404, detail="restaurante nao encontrado")
    rec.pop("passw", None)
    rec.pop("phone", None)
    rec.pop("products", None)

    merchant_products = products.query.find(proprietor=id)
    for p in merchant_products:
        p.pop("passw", None)
        _normalize_photo(p)
    rec["products"] = merchant_products

    return rec
