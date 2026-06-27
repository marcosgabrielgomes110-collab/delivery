from pybase import Pybase as pb

products_schema = pb.schema(
    name=str,
    photo=pb.image,
    price=float,
    description=str,
    proprietor=str,
    accompaniments=pb.optional(list, []),
)
