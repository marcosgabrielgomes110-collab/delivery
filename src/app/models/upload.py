from pydantic import BaseModel


class UploadAvatar(BaseModel):
    user_id: str
    user_type: str
