from pydantic import BaseModel


class RegisterMerchant(BaseModel):
    name: str
    email: str
    phone: str
    avatar: str | None = None
    password: str
