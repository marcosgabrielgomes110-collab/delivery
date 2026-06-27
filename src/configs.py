from pathlib import Path

from dotenv import load_dotenv
import os

load_dotenv()

path = Path(os.getenv("PATHDB", "./data"))
password = os.getenv("PASSW", "")

jwt_secret = os.getenv("JWT_SECRET", "default-secret")
jwt_expiry_minutes = int(os.getenv("JWT_EXPIRY_MINUTES", "60"))

clients_table = "client"
merchants_table = "merchant"
tokens_table = "tokens"
products_table = "products"
