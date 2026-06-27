from pydantic import BaseModel


class RegisterClient(BaseModel):
    name: str
    email: str
    phone: str
    avatar: str | None = None
    password: str
