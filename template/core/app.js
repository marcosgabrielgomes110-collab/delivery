import { initRouter, registerRoute } from './router.js'
import { loginPage } from '../pages/login.js'
import { registerPage } from '../pages/register.js'
import { homeClientPage } from '../pages/home-client.js'
import { homeMerchantPage } from '../pages/home-merchant.js'
import { merchantProductsPage } from '../pages/merchant-products.js'
import { clientShopsPage } from '../pages/client-shops.js'

export function initApp() {
  registerRoute('/login', loginPage)
  registerRoute('/register', registerPage)
  registerRoute('/home/client', homeClientPage)
  registerRoute('/home/merchant', homeMerchantPage)
  registerRoute('/home/merchant/products', merchantProductsPage)
  registerRoute('/home/client/shops', clientShopsPage)

  initRouter()
}
