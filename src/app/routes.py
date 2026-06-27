base = "/api/v1/"

# register
register_client = base + "register/client"
register_merchant = base + "register/merchant"

# auth
login_client = base + "auth/login/client"
login_merchant = base + "auth/login/merchant"
logout = base + "auth/logout"
logout_all = base + "auth/logout/all"
refresh = base + "auth/refresh"
validate_token = base + "auth/validate"

# media (public)
media = base + "media/{db_name}/{filename}"
upload_avatar = base + "upload/avatar"
delete_media = base + "media/{db_name}/{filename}"

# products
products_list = base + "products"
product_register = base + "products/register"
product_detail = base + "products/{id}"
product_update = base + "products/{id}"
product_delete = base + "products/{id}"

# public
public_products = base + "public/products"
public_merchants = base + "public/merchants"
public_merchant_detail = base + "public/merchants/{id}"
