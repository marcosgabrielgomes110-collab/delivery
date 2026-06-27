from pybase import Pybase as pb

merchants_schema = pb.schema(
    name=str,
    email=str,
    phone=pb.cript(str),
    avatar=pb.optional(pb.image),
    passw=pb.cript(str),
    products=pb.optional(list, []),
)
