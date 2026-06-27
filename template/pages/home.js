import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast } from '../core/functions.js'
import config from '../configs.js'
import Cookies from 'js-cookie'

export function homePage(container) {
  const userStr = Cookies.get(config.COOKIE_KEYS.USER)
  const user = userStr ? JSON.parse(userStr) : {}

  container.innerHTML = `
    <div class="home-container">
      <div class="home-header">
        <h1>Bem-vindo, ${user.name || 'Utilizador'}!</h1>
        <button id="logout-btn" class="btn btn-logout">Sair</button>
      </div>
      <div class="home-content">
        <p>Área principal da aplicação.</p>
      </div>
    </div>
  `

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await api.post(config.ENDPOINTS.AUTH.LOGOUT)
    } catch (err) {
      // ignora erro no logout
    }
    Cookies.remove(config.COOKIE_KEYS.USER)
    Cookies.remove(config.COOKIE_KEYS.USER_TYPE)
    navigate('/login')
  })
}
