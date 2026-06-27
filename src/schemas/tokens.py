from pybase import Pybase as pb

tokens_schema = pb.schema(
    user_id=str,
    user_type=str,
    token=pb.cript(str),
    expires_at=float,
)
