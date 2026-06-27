from pybase import Pybase as pb

from src.configs import path, password, clients_table, merchants_table, tokens_table, products_table

from src.schemas.clients import clients_schema
from src.schemas.merchant import merchants_schema
from src.schemas.tokens import tokens_schema
from src.schemas.products import products_schema

client_path = path / clients_table
merchat_path = path / merchants_table
tokens_path = path / tokens_table
products_path = path / products_table

clients = pb.database(client_path, password, schema=clients_schema)
merchants = pb.database(merchat_path, password, schema=merchants_schema)
tokens = pb.database(tokens_path, password, schema=tokens_schema)
products = pb.database(products_path, password, schema=products_schema)
