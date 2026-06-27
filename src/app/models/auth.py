from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class LogoutRequest(BaseModel):
    token: str


class LogoutAllRequest(BaseModel):
    user_id: str
    user_type: str


class RefreshRequest(BaseModel):
    token: str


class ValidateRequest(BaseModel):
    token: str
