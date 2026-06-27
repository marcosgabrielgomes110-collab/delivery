import { navigate } from '../core/router.js'
import { api } from '../core/api.js'
import { showToast } from '../core/functions.js'
import config from '../configs.js'
import Cookies from 'js-cookie'

export function homeClientPage(container) {
  const userStr = Cookies.get(config.COOKIE_KEYS.USER)
  const user = userStr ? JSON.parse(userStr) : {}

  container.innerHTML = `
    <div class="dashboard">
      <nav class="sidebar">
        <div class="sidebar-header">
          <h2>PySupa</h2>
          <span class="badge badge-client">Cliente</span>
        </div>
        <ul class="sidebar-menu">
          <li class="active"><a href="#/home/client">Inicio</a></li>
          <li><a href="#/home/client/shops">Lojas</a></li>
          <li><a href="#/home/client/orders">Pedidos</a></li>
          <li><a href="#/home/client/favorites">Favoritos</a></li>
          <li><a href="#/home/client/profile">Perfil</a></li>
        </ul>
        <button id="logout-btn" class="btn btn-sidebar-logout">Sair</button>
      </nav>
      <main class="main-content">
        <div class="topbar">
          <h1>Bem-vindo, ${user.name || 'Cliente'}!</h1>
          <div class="user-info">
            <span>${user.email || ''}</span>
          </div>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-info">
              <span class="stat-value">0</span>
              <span class="stat-label">Pedidos</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">❤️</div>
            <div class="stat-info">
              <span class="stat-value">0</span>
              <span class="stat-label">Favoritos</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏪</div>
            <div class="stat-info">
              <span class="stat-value">0</span>
              <span class="stat-label">Lojas Visitadas</span>
            </div>
          </div>
        </div>
        <div class="section-card">
          <h3>Atividade Recente</h3>
          <p class="empty-state">Nenhuma atividade recente.</p>
        </div>
      </main>
    </div>
  `

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      await api.post(config.ENDPOINTS.AUTH.LOGOUT)
    } catch (err) {}
    Cookies.remove(config.COOKIE_KEYS.USER)
    Cookies.remove(config.COOKIE_KEYS.USER_TYPE)
    navigate('/login')
  })
}
